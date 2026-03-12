import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Dish } from '../restaurants/entities/dish.entity';

import { CreateOrderInput } from './dto/create-order.dto';
import { OrderOutput, OrdersOutput } from './dto/orders-output.dto';
import {
  PUB_SUB,
  ORDER_UPDATED,
  NEW_ORDER,
  NEW_DELIVERY,
} from '../common/pubsub/pubsub.provider';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,

    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,

    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
    // Inject PubSub عشان نرسل أحداث فورية
  ) {}

  // ─── إنشاء طلب جديد ──────────────────────────────────────
  async createOrder(
    customer: User,
    input: CreateOrderInput,
  ): Promise<OrderOutput> {
    try {
      // 1. جلب المطعم مع رسوم التوصيل
      const restaurant = await this.restaurantRepo.findOne({
        where: { id: input.restaurantId },
      });

      if (!restaurant) {
        return { ok: false, error: 'المطعم غير موجود' };
      }

      if (!restaurant.isOpen) {
        return { ok: false, error: 'المطعم مغلق حالياً' };
      }

      // 2. إنشاء بنود الطلب وحساب المجموع
      let total = restaurant.deliveryFee;
      // نبدأ بإضافة رسوم التوصيل للمجموع
      const orderItems: OrderItem[] = [];

      for (const item of input.items) {
        const dish = await this.dishRepo.findOne({
          where: { id: item.dishId },
        });

        if (!dish) {
          return { ok: false, error: `الصنف ${item.dishId} غير موجود` };
        }

        if (!dish.isAvailable) {
          return { ok: false, error: `${dish.name} غير متوفر حالياً` };
        }

        // ⚠️ Snapshot للسعر — نحفظ السعر الحالي
        // لأن السعر قد يتغير مستقبلاً
        const orderItem = this.orderItemRepo.create({
          dish,
          quantity: item.quantity,
          price: dish.price,
          // السعر وقت الطلب وليس وقت التوصيل
        });

        total += dish.price * item.quantity;
        orderItems.push(orderItem);
      }

      // 3. تحقق من الحد الأدنى للطلب
      if (total - restaurant.deliveryFee < restaurant.minOrderAmount) {
        return {
          ok: false,
          error: `الحد الأدنى للطلب ${restaurant.minOrderAmount} دج`,
        };
      }

      // 4. إنشاء الطلب
      const order = this.orderRepo.create({
        customer,
        restaurant,
        items: orderItems,
        total,
        deliveryAddress: input.deliveryAddress,
        deliveryLat: input.deliveryLat,
        deliveryLng: input.deliveryLng,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await this.orderRepo.save(order);

      // 5. 🔔 إرسال إشعار فوري للمطعم
      await this.pubSub.publish(NEW_ORDER, {
        newOrderForRestaurant: savedOrder,
        // المطعم المعني فقط سيتلقى هذا الحدث
        // (نفلتر في الـ Subscription)
        ownerId: restaurant.owner,
      });

      return { ok: true, order: savedOrder };
    } catch (e) {
      return { ok: false, error: 'فشل إنشاء الطلب' };
    }
  }

  // ─── جلب طلبات المستخدم حسب دوره ────────────────────────
  async getMyOrders(user: User): Promise<OrdersOutput> {
    try {
      let orders: Order[];

      if (user.role === UserRole.CUSTOMER) {
        // العميل يرى طلباته فقط
        orders = await this.orderRepo.find({
          where: { customer: { id: user.id } },
          order: { createdAt: 'DESC' },
        });
      } else if (user.role === UserRole.DRIVER) {
        // السائق يرى توصيلاته
        orders = await this.orderRepo.find({
          where: { driver: { id: user.id } },
          order: { createdAt: 'DESC' },
        });
      } else if (user.role === UserRole.OWNER) {
        // صاحب المطعم يرى طلبات مطعمه
        orders = await this.orderRepo.find({
          where: { restaurant: { owner: { id: user.id } } },
          order: { createdAt: 'DESC' },
        });
      } else {
        // Admin يرى كل الطلبات
        orders = await this.orderRepo.find({
          order: { createdAt: 'DESC' },
        });
      }

      return { ok: true, orders };
    } catch {
      return { ok: false, error: 'فشل جلب الطلبات' };
    }
  }

  // ─── جلب تفاصيل طلب واحد ─────────────────────────────────
  async getOrderById(user: User, orderId: string): Promise<OrderOutput> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['customer', 'restaurant', 'driver', 'items', 'items.dish'],
      });

      if (!order) {
        return { ok: false, error: 'الطلب غير موجود' };
      }

      // تحقق إن المستخدم مصرح له برؤية هذا الطلب
      const canSee =
        user.role === UserRole.ADMIN ||
        order.customer.id === user.id ||
        order.restaurant.owner?.id === user.id ||
        order.driver?.id === user.id;

      if (!canSee) {
        return { ok: false, error: 'غير مصرح لك برؤية هذا الطلب' };
      }

      return { ok: true, order };
    } catch {
      return { ok: false, error: 'فشل جلب الطلب' };
    }
  }

  // ─── تحديث حالة الطلب ────────────────────────────────────
  async updateOrderStatus(
    user: User,
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderOutput> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['customer', 'restaurant', 'restaurant.owner', 'driver'],
      });

      if (!order) {
        return { ok: false, error: 'الطلب غير موجود' };
      }

      // ─── State Machine — كل دور يقدر يغير حالات معينة فقط
      let canUpdate = false;

      if (user.role === UserRole.OWNER) {
        // المطعم يقدر: PENDING→ACCEPTED | ACCEPTED→COOKING | COOKING→READY
        canUpdate =
          order.restaurant.owner.id === user.id &&
          [
            OrderStatus.ACCEPTED,
            OrderStatus.COOKING,
            OrderStatus.READY,
            OrderStatus.CANCELLED,
          ].includes(status);

      } else if (user.role === UserRole.DRIVER) {
        // السائق يقدر: READY→PICKED_UP | PICKED_UP→DELIVERED
        canUpdate =
          order.driver?.id === user.id &&
          [OrderStatus.PICKED_UP, OrderStatus.DELIVERED].includes(status);
      }

      if (!canUpdate) {
        return { ok: false, error: 'غير مصرح بهذا التحديث' };
      }

      order.status = status;
      const updated = await this.orderRepo.save(order);

      // 🔔 إشعار فوري لكل المعنيين بتغيير الحالة
      await this.pubSub.publish(ORDER_UPDATED, {
        orderStatusUpdated: updated,
      });

      // 🔔 إذا الطلب صار READY — أرسل للسائقين المتاحين
      if (status === OrderStatus.READY) {
        await this.pubSub.publish(NEW_DELIVERY, {
          newDeliveryForDriver: updated,
        });
      }

      return { ok: true, order: updated };
    } catch {
      return { ok: false, error: 'فشل تحديث الطلب' };
    }
  }

  // ─── السائق يستلم الطلب ───────────────────────────────────
  async takeOrder(driver: User, orderId: string): Promise<OrderOutput> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId, status: OrderStatus.READY },
      });

      if (!order) {
        return { ok: false, error: 'الطلب غير متاح للاستلام' };
      }

      if (order.driver) {
        return { ok: false, error: 'تم استلام هذا الطلب من قِبل سائق آخر' };
      }

      // عيّن السائق على الطلب
      order.driver = driver;
      order.status = OrderStatus.PICKED_UP;
      const updated = await this.orderRepo.save(order);

      // 🔔 إشعار فوري للعميل إن السائق استلم طلبه
      await this.pubSub.publish(ORDER_UPDATED, {
        orderStatusUpdated: updated,
      });

      return { ok: true, order: updated };
    } catch {
      return { ok: false, error: 'فشل استلام الطلب' };
    }
  }
}