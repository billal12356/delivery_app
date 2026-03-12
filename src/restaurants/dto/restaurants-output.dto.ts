import { ObjectType, Field } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { Category } from '../entities/category.entity';
import { Dish } from '../entities/dish.entity';

@ObjectType()
export class RestaurantOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}

@ObjectType()
export class RestaurantsOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}

@ObjectType()
export class CategoryOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Category, { nullable: true })
  category?: Category;
}

@ObjectType()
export class DishOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Dish, { nullable: true })
  dish?: Dish;
}