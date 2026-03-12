import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Category } from './category.entity';

@ObjectType()
@Entity('dishes')
export class Dish extends BaseEntity {

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => Float)
  @Column({ type: 'float' })
  price: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  photo?: string;

  @Field()
  @Column({ default: true })
  isAvailable: boolean;


  @ManyToOne(() => Category, (category) => category.dishes, {
    onDelete: 'CASCADE',
  })
  category: Category;
}