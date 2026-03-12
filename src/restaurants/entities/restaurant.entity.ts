import { ObjectType, Field } from '@nestjs/graphql';
import {
  Entity, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';

@ObjectType()
@Entity('restaurants')
export class Restaurant extends BaseEntity {

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  address: string;

  @Field()
  @Column({ type: 'float' })
  lat: number;

  @Field()
  @Column({ type: 'float' })
  lng: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  coverImage?: string;

  @Field()
  @Column({ default: true })
  isOpen: boolean;

  @Field()
  @Column({ type: 'float', default: 0 })
  deliveryFee: number;

  @Field()
  @Column({ type: 'float', default: 0 })
  minOrderAmount: number;

  @Field()
  @Column({ default: 30 })
  estimatedDeliveryTime: number;

  @Field(() => User)
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  owner: User;


  @Field(() => [Category], { nullable: true })
  @OneToMany(() => Category, (category) => category.restaurant, {
    cascade: true,   
    nullable: true,
  })
  categories?: Category[];
}