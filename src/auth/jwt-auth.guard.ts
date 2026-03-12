import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // الـ Subscriptions تستخدم WebSocket — الـ req مختلف
    const req = gqlContext.req || gqlContext.extra?.request;

    if (!req) {
      throw new UnauthorizedException();
    }

    return req;
  }

  // نتجاوز handleRequest عشان نتحكم في رسالة الخطأ
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('يرجى تسجيل الدخول');
    }
    return user;
  }
}
