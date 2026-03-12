import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Restaurant } from './restaurant.entity';
import { Dish } from './dish.entity';

@ObjectType()
@Entity('categories')
export class Category extends BaseEntity {

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  coverImage?: string;


  @ManyToOne(() => Restaurant, (restaurant) => restaurant.categories, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @Field(() => [Dish], { nullable: true })
  @OneToMany(() => Dish, (dish) => dish.category, {
    cascade: true,
    nullable: true,
  })
  dishes?: Dish[];
}