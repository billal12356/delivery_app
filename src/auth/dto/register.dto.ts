import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

@InputType()
export class RegisterInput {

  @Field()
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => UserRole, { defaultValue: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  role: UserRole = UserRole.CUSTOMER;
}