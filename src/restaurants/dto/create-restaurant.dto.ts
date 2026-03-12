import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString, IsNumber, IsOptional,
  IsUrl, Min, Max, MinLength,
} from 'class-validator';

@InputType()
export class CreateRestaurantInput {

  @Field()
  @IsString()
  @MinLength(2, { message: 'اسم المطعم يجب أن يكون حرفين على الأقل' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  address: string;

  @Field(() => Float)
  @IsNumber()
  @Min(-90) @Max(90)
  lat: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180) @Max(180)
  lng: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صحيح' })
  coverImage?: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  minOrderAmount: number;

  @Field({ defaultValue: 30 })
  @IsNumber()
  @Min(5)
  estimatedDeliveryTime: number;
}