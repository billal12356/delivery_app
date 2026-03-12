import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, BeforeInsert, OneToMany } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  ADMIN    = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  OWNER    = 'OWNER',
  DRIVER   = 'DRIVER',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'دور المستخدم في النظام',
});

export enum UserVerificationStatus {
  PENDING  = 'PENDING',
  VERIFIED = 'VERIFIED',
}

registerEnumType(UserVerificationStatus, {
  name: 'UserVerificationStatus',
});

@ObjectType()   
@Entity('users')
export class User extends BaseEntity {

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Column()
  password: string;

  @Field(() => UserRole)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Field()
  @Column({ default: false })
  isVerified: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'float' })
  lat?: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'float' })
  lng?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileImage?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}