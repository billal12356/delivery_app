import {
  Injectable, CanActivate, ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../users/entities/user.entity';

// Decorator لتحديد الأدوار المسموحة
export const ROLES_KEY = 'roles';
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
// الاستخدام: @Roles(UserRole.ADMIN, UserRole.OWNER)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // اقرأ الأدوار المطلوبة من الـ Decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // إذا لم يُحدد دور معين، اسمح للجميع
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // استخرج المستخدم من الـ GraphQL Context
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    if (!user) return false;

    // تحقق إن دور المستخدم ضمن الأدوار المسموحة
    return requiredRoles.includes(user.role);
  }
}