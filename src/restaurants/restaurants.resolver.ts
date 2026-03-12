import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Float } from '@nestjs/graphql';

import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { User, UserRole } from '../users/entities/user.entity';

import { CreateRestaurantInput } from './dto/create-restaurant.dto';
import { UpdateRestaurantInput } from './dto/update-restaurant.dto';
import { CreateCategoryInput } from './dto/create-category.dto';
import { CreateDishInput } from './dto/create-dish.dto';
import { UpdateDishInput } from './dto/update-dish.dto';
import {
  RestaurantOutput, RestaurantsOutput,
  CategoryOutput, DishOutput,
} from './dto/restaurants-output.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { AuthUser } from 'src/common/entities/decorators/auth-user.decorator';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ─── Public Queries (لا تحتاج تسجيل دخول) ───────────────

  @Query(() => RestaurantsOutput)
  restaurants(): Promise<RestaurantsOutput> {
    return this.restaurantsService.getAllRestaurants();
  }

  @Query(() => RestaurantOutput)
  restaurant(
    @Args('id') id: string,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.getRestaurantById(id);
  }

  @Query(() => RestaurantsOutput)
  nearbyRestaurants(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
    @Args('radius', { type: () => Float, defaultValue: 10 }) radius: number,
  ): Promise<RestaurantsOutput> {
    return this.restaurantsService.getNearbyRestaurants(lat, lng, radius);
  }

  // ─── Protected — Owner فقط ────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Query(() => RestaurantOutput)
  myRestaurant(
    @AuthUser() owner: User,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.getMyRestaurant(owner);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => RestaurantOutput)
  createRestaurant(
    @AuthUser() owner: User,
    @Args('input') input: CreateRestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.createRestaurant(owner, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => RestaurantOutput)
  updateRestaurant(
    @AuthUser() owner: User,
    @Args('id') id: string,
    @Args('input') input: UpdateRestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.updateRestaurant(owner, id, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => RestaurantOutput)
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('id') id: string,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(owner, id);
  }

  // ─── Categories ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => CategoryOutput)
  createCategory(
    @AuthUser() owner: User,
    @Args('input') input: CreateCategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantsService.createCategory(owner, input);
  }

  // ─── Dishes ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => DishOutput)
  createDish(
    @AuthUser() owner: User,
    @Args('input') input: CreateDishInput,
  ): Promise<DishOutput> {
    return this.restaurantsService.createDish(owner, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => DishOutput)
  updateDish(
    @AuthUser() owner: User,
    @Args('id') id: string,
    @Args('input') input: UpdateDishInput,
  ): Promise<DishOutput> {
    return this.restaurantsService.updateDish(owner, id, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Mutation(() => DishOutput)
  toggleDishAvailability(
    @AuthUser() owner: User,
    @Args('dishId') dishId: string,
  ): Promise<DishOutput> {
    return this.restaurantsService.toggleDishAvailability(owner, dishId);
  }
}