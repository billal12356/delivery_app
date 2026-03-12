import {
  Resolver, Query, Mutation,
  Args, Subscription, Context,
} from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { User, UserRole } from '../users/entities/user.entity';

import { CreateOrderInput } from './dto/create-order.dto';
import { OrderOutput, OrdersOutput } from './dto/orders-output.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import {
  PUB_SUB,
  ORDER_UPDATED,
  NEW_ORDER,
  NEW_DELIVERY,
} from '../common/pubsub/pubsub.provider';
import { AuthUser } from 'src/common/entities/decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,

    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  // ─── Queries ─────────────────────────────────────────────

  @Query(() => OrdersOutput)
  myOrders(@AuthUser() user: User): Promise<OrdersOutput> {
    return this.ordersService.getMyOrders(user);
  }

  @Query(() => OrderOutput)
  order(
    @AuthUser() user: User,
    @Args('id') id: string,
  ): Promise<OrderOutput> {
    return this.ordersService.getOrderById(user, id);
  }

  // ─── Mutations ───────────────────────────────────────────

  @Roles(UserRole.CUSTOMER)
  @Mutation(() => OrderOutput)
  createOrder(
    @AuthUser() customer: User,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderOutput> {
    return this.ordersService.createOrder(customer, input);
  }

  @Roles(UserRole.OWNER, UserRole.DRIVER)
  @Mutation(() => OrderOutput)
  updateOrderStatus(
    @AuthUser() user: User,
    @Args('orderId') orderId: string,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ): Promise<OrderOutput> {
    return this.ordersService.updateOrderStatus(user, orderId, status);
  }

  @Roles(UserRole.DRIVER)
  @Mutation(() => OrderOutput)
  takeOrder(
    @AuthUser() driver: User,
    @Args('orderId') orderId: string,
  ): Promise<OrderOutput> {
    return this.ordersService.takeOrder(driver, orderId);
  }

  // ─── Subscriptions — الاشتراكات الفورية ──────────────────

  // 1️⃣ العميل يتابع حالة طلبه
  @Subscription(() => Order, {
    // filter: يرجع الحدث فقط للعميل الذي قدّم الطلب
    filter(payload, variables, context) {
      const user = context.req?.user;
      return payload.orderStatusUpdated.customer.id === user?.id ||
             payload.orderStatusUpdated.driver?.id === user?.id ||
             payload.orderStatusUpdated.restaurant?.owner?.id === user?.id;
    },
  })
  orderStatusUpdated() {
    return this.pubSub.asyncIterableIterator(ORDER_UPDATED);
    // asyncIterableIterator = يستمع لكل أحداث ORDER_UPDATED
  }

  // 2️⃣ المطعم يتلقى الطلبات الجديدة
  @Roles(UserRole.OWNER)
  @Subscription(() => Order, {
    filter(payload, _variables, context) {
      const user = context.req?.user;
      // فلتر: فقط صاحب المطعم المعني يتلقى الإشعار
      return payload.ownerId?.id === user?.id;
    },
  })
  newOrderForRestaurant() {
    return this.pubSub.asyncIterableIterator(NEW_ORDER);
  }

  // 3️⃣ السائقون يتلقون طلبات التوصيل المتاحة
  @Roles(UserRole.DRIVER)
  @Subscription(() => Order)
  newDeliveryForDriver() {
    return this.pubSub.asyncIterableIterator(NEW_DELIVERY);
    // كل السائقين المتاحين يتلقون هذا الحدث
    // ثم أول واحد يضغط takeOrder يأخذه
  }
}