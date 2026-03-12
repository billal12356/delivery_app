import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString, IsNumber, IsOptional,
  IsUrl, Min, MinLength,
} from 'class-validator';

@InputType()
export class CreateDishInput {

  @Field()
  @IsString()
  @MinLength(2)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'السعر يجب أن يكون أكبر من 0' })
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  photo?: string;

  @Field()
  @IsString()
  categoryId: string;
}