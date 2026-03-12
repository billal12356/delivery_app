import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from './order.entity';
import { Dish } from '../../restaurants/entities/dish.entity';

@ObjectType()
@Entity('order_items')
export class OrderItem extends BaseEntity {

  @Field(() => Int)
  @Column()
  quantity: number;


  @Field(() => Float)
  @Column({ type: 'float' })
  price: number;



  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @Field(() => Dish)
  @ManyToOne(() => Dish, { eager: true })
  @JoinColumn()
  dish: Dish;
}