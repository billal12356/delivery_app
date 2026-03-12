import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Dish } from '../restaurants/entities/dish.entity';
import { pubSubProvider } from '../common/pubsub/pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Restaurant, Dish]),
  ],
  providers: [
    OrdersService,
    OrdersResolver,
    pubSubProvider,
    // نسجل PubSub كـ provider عشان يكون injectable
  ],
  exports: [OrdersService, pubSubProvider],
})
export class OrdersModule {}