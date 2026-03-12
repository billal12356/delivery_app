import {
  ObjectType, Field, Float, registerEnumType,
} from '@nestjs/graphql';
import {
  Entity, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { OrderItem } from './order-item.entity';

// ─── حالات الطلب — State Machine ─────────────────────────
export enum OrderStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  COOKING   = 'COOKING',
  READY     = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'حالة الطلب في كل مرحلة',
});

@ObjectType()
@Entity('orders')
export class Order extends BaseEntity {

  @Field(() => OrderStatus)
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Field(() => Float)
  @Column({ type: 'float' })
  total: number;


  @Field()
  @Column()
  deliveryAddress: string;


  @Field({ nullable: true })
  @Column({ nullable: true, type: 'float' })
  deliveryLat?: number;


  @Field({ nullable: true })
  @Column({ nullable: true, type: 'float' })
  deliveryLng?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  rejectionReason?: string;



  @Field(() => User)
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  customer: User;


  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, { eager: true })
  @JoinColumn()
  restaurant: Restaurant;


  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn()
  driver?: User;


  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}