import { ObjectType, Field, Float } from '@nestjs/graphql';

// نوع الإحداثيات — يُستخدم في كل المشروع
@ObjectType()
export class DriverLocation {

  @Field()
  driverId: string;

  @Field(() => Float)
  lat: number;

  @Field(() => Float)
  lng: number;

  @Field({ nullable: true })
  heading?: number;
  // اتجاه السيارة بالدرجات (0-360)

  @Field({ nullable: true })
  speed?: number;
  // السرعة بـ km/h
}

// نتيجة حساب المسافة والوقت
@ObjectType()
export class RouteInfo {

  @Field()
  distance: string;
  // مثال: "5.2 كم"

  @Field()
  duration: string;
  // مثال: "15 دقيقة"

  @Field(() => Float)
  distanceValue: number;
  // بالمتر

  @Field(() => Float)
  durationValue: number;
  // بالثواني
}