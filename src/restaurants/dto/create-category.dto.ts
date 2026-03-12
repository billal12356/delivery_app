import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsUrl, MinLength } from 'class-validator';

@InputType()
export class CreateCategoryInput {

  @Field()
  @IsString()
  @MinLength(2)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @Field()
  @IsString()
  restaurantId: string;
}