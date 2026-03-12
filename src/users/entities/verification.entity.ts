import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, BeforeInsert } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Entity('verifications')
export class Verification extends BaseEntity {

  @Field()
  @Column()
  code: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  user: User;


  @BeforeInsert()
  createCode() {
    this.code = uuidv4().substring(0, 6).toUpperCase();
  }
}