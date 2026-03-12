import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';

import { DRIVER_LOCATION, PUB_SUB } from 'src/common/pubsub/pubsub.provider';
import { UpdateDriverLocationInput } from './dto/driver.dto';
import { DriverLocation, RouteInfo } from 'src/maps/maps.types';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { MapsService } from 'src/maps/maps.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    private readonly mapsService: MapsService,

    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  // ─── تحديث موقع السائق ───────────────────────────────────
  async updateLocation(
    driver: User,
    input: UpdateDriverLocationInput,
  ): Promise<boolean> {
    try {
      // 1. تحديث الإحداثيات في قاعدة البيانات
      await this.userRepo.update(driver.id, {
        lat: input.lat,
        lng: input.lng,
      });

      // 2. 🔔 بث الموقع الجديد لكل المشتركين
      const locationUpdate: DriverLocation = {
        driverId: driver.id,
        lat: input.lat,
        lng: input.lng,
        heading: input.heading,
        speed: input.speed,
      };

      await this.pubSub.publish(DRIVER_LOCATION, {
        driverLocationUpdated: locationUpdate,
      });

      return true;
    } catch {
      return false;
    }
  }

  // ─── تفعيل/إيقاف وضع التوافر ─────────────────────────────
  async updateAvailability(
    driver: User,
    isAvailable: boolean,
  ): Promise<boolean> {
    try {
      await this.userRepo.update(driver.id, { isActive: isAvailable });
      return true;
    } catch {
      return false;
    }
  }

  async calculateDriverRoute(
    driver: User,
    orderId: string,
  ): Promise<{
    ok: boolean;
    error?: string;
    toRestaurant?: RouteInfo | null; // ← أضف | null
    toCustomer?: RouteInfo | null; // ← أضف | null
  }> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId, driver: { id: driver.id } },
        relations: ['restaurant', 'customer'],
      });

      if (!order) {
        return { ok: false, error: 'الطلب غير موجود' };
      }

      if (!driver.lat || !driver.lng) {
        return { ok: false, error: 'يرجى تفعيل الموقع أولاً' };
      }

      if (!order.deliveryLat || !order.deliveryLng) {
        return { ok: false, error: 'عنوان التوصيل غير محدد' };
      }

      const driverLat = driver.lat;
      const driverLng = driver.lng;
      const deliveryLat = order.deliveryLat;
      const deliveryLng = order.deliveryLng;

      const toRestaurant = await this.mapsService.getRouteInfo(
        driverLat,
        driverLng,
        order.restaurant.lat,
        order.restaurant.lng,
      );

      const toCustomer = await this.mapsService.getRouteInfo(
        order.restaurant.lat,
        order.restaurant.lng,
        deliveryLat,
        deliveryLng,
      );

      return { ok: true, toRestaurant, toCustomer };
    } catch {
      return { ok: false, error: 'فشل حساب المسار' };
    }
  }

  // ─── جلب السائقين المتاحين القريبين ─────────────────────
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<User[]> {
    try {
      // جلب كل السائقين النشطين
      const drivers = await this.userRepo.find({
        where: {
          role: UserRole.DRIVER,
          isActive: true,
          isVerified: true,
        },
      });

      // فلترة السائقين القريبين باستخدام Haversine
      return drivers.filter((d) => {
        if (!d.lat || !d.lng) return false;

        const distance = this.mapsService.calculateDistanceKm(
          lat,
          lng,
          d.lat,
          d.lng,
        );

        return distance <= radiusKm;
      });
    } catch {
      return [];
    }
  }

  // ─── إحصائيات السائق ─────────────────────────────────────
  async getDriverStats(driver: User): Promise<{
    totalDeliveries: number;
    todayDeliveries: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDeliveries = await this.orderRepo.count({
      where: {
        driver: { id: driver.id },
        status: OrderStatus.DELIVERED,
      },
    });

    const todayDeliveries = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId: driver.id })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.updatedAt >= :today', { today })
      .getCount();

    return { totalDeliveries, todayDeliveries };
  }
}
