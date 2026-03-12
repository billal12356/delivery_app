import { InputType, ObjectType, Field, Float } from '@nestjs/graphql';
import { IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { RouteInfo } from '../../maps/maps.types';

@InputType()
export class UpdateDriverLocationInput {

  @Field(() => Float)
  @IsNumber()
  @Min(-90) @Max(90)
  lat: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180) @Max(180)
  lng: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  heading?: number;
  // اتجاه السيارة

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  speed?: number;
}

@InputType()
export class UpdateDriverAvailabilityInput {

  @Field()
  @IsBoolean()
  isAvailable: boolean;
}

@ObjectType()
export class DriverRouteOutput {

  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => RouteInfo, { nullable: true })
  toRestaurant?: RouteInfo | null;  // ← أضف | null

  @Field(() => RouteInfo, { nullable: true })
  toCustomer?: RouteInfo | null;    // ← أضف | null
}