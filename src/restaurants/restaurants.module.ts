import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RestaurantsService } from './restaurants.service';
import { RestaurantsResolver } from './restaurants.resolver';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category, Dish]),
  ],
  providers: [RestaurantsService, RestaurantsResolver],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}