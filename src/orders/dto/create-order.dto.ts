import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString, IsNumber, IsArray,
  ValidateNested, Min, IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

// بنود الطلب — كل صنف مع كميته
@InputType()
export class OrderItemInput {

  @Field()
  @IsString()
  dishId: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'الكمية يجب أن تكون 1 على الأقل' })
  quantity: number;
}

@InputType()
export class CreateOrderInput {

  @Field()
  @IsString()
  restaurantId: string;

  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  // each: true = تحقق من كل عنصر في المصفوفة
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @Field()
  @IsString()
  deliveryAddress: string;

  @Field(() => Float)
  @IsNumber()
  deliveryLat: number;

  @Field(() => Float)
  @IsNumber()
  deliveryLng: number;
}