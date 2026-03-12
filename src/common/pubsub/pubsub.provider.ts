import { PubSub } from 'graphql-subscriptions';

// ثوابت أسماء الأحداث — نستخدمها في كل مكان
// عشان ما نكتب strings بشكل مباشر ونغلط
export const ORDER_UPDATED   = 'ORDER_UPDATED';
export const NEW_ORDER       = 'NEW_ORDER';
export const NEW_DELIVERY    = 'NEW_DELIVERY';
export const DRIVER_LOCATION = 'DRIVER_LOCATION';

// PubSub instance واحد مشترك في كل المشروع
// في Production نستبدله بـ RedisPubSub
export const PUB_SUB = 'PUB_SUB';

export const pubSubProvider = {
  provide: PUB_SUB,
  useValue: new PubSub(),
  // PubSub() = InMemory — للـ Development
  // للـ Production: new RedisPubSub({ connection: redisConfig })
};