import {
  Resolver, Mutation, Query,
  Args, Subscription,
} from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

import { User, UserRole } from '../users/entities/user.entity';
import { DriverLocation, RouteInfo } from '../maps/maps.types';
import {
  UpdateDriverLocationInput,
  UpdateDriverAvailabilityInput,
  DriverRouteOutput,
} from './dto/driver.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import {
  PUB_SUB,
  DRIVER_LOCATION,
} from '../common/pubsub/pubsub.provider';
import { DriversService } from './drivers.service';
import { AuthUser } from 'src/common/entities/decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Resolver()
export class DriversResolver {
  constructor(
    private readonly driversService: DriversService,

    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  // ─── السائق يحدث موقعه ───────────────────────────────────
  @Roles(UserRole.DRIVER)
  @Mutation(() => Boolean)
  updateDriverLocation(
    @AuthUser() driver: User,
    @Args('input') input: UpdateDriverLocationInput,
  ): Promise<boolean> {
    return this.driversService.updateLocation(driver, input);
    // كل 5 ثواني يرسل الموبايل هذه الـ Mutation
  }

  // ─── السائق يغير وضع توافره ──────────────────────────────
  @Roles(UserRole.DRIVER)
  @Mutation(() => Boolean)
  updateDriverAvailability(
    @AuthUser() driver: User,
    @Args('input') input: UpdateDriverAvailabilityInput,
  ): Promise<boolean> {
    return this.driversService.updateAvailability(
      driver,
      input.isAvailable,
    );
  }

  // ─── حساب المسار الكامل ───────────────────────────────────
  @Roles(UserRole.DRIVER)
  @Query(() => DriverRouteOutput)
  driverRoute(
    @AuthUser() driver: User,
    @Args('orderId') orderId: string,
  ): Promise<DriverRouteOutput> {
    return this.driversService.calculateDriverRoute(driver, orderId);
  }

  // ─── إحصائيات السائق ─────────────────────────────────────
  @Roles(UserRole.DRIVER)
  @Query(() => String)
  async driverStats(@AuthUser() driver: User): Promise<string> {
    const stats = await this.driversService.getDriverStats(driver);
    return JSON.stringify(stats);
    // سنحوله لـ ObjectType لاحقاً
  }

  // ─── Subscription: العميل يتابع موقع السائق ──────────────
  @Subscription(() => DriverLocation, {
    // فلتر: فقط العميل الذي لديه طلب نشط مع هذا السائق
    filter(payload, variables) {
      return payload.driverLocationUpdated.driverId === variables.driverId;
    },
  })
  driverLocationUpdated(
    @Args('driverId') driverId: string,
  ) {
    return this.pubSub.asyncIterableIterator(DRIVER_LOCATION);
    // العميل يمرر driverId عشان يتابع سائقه فقط
  }
}