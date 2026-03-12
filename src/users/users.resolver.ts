import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { UpdateProfileInput } from './dto/update-profile.dto';
import { UpdateLocationInput } from './dto/update-location.dto';
import { UpdateProfileOutput, GetUsersOutput } from './dto/users-output.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { AuthUser } from 'src/common/entities/decorators/auth-user.decorator';

// نطبق JwtAuthGuard على كل الـ Resolver
// بمعنى كل العمليات تحتاج تسجيل دخول
@UseGuards(JwtAuthGuard, RolesGuard)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // ─── Admin فقط: جلب كل المستخدمين ────────────────────────
  @Roles(UserRole.ADMIN)
  @Query(() => GetUsersOutput)
  getAllUsers(): Promise<GetUsersOutput> {
    return this.usersService.getAllUsers();
  }

  // ─── Admin فقط: جلب مستخدم بالـ ID ───────────────────────
  @Roles(UserRole.ADMIN)
  @Query(() => User, { nullable: true })
  getUser(@Args('id') id: string): Promise<User | null> {
    return this.usersService.getUserById(id);
  }

  // ─── أي مستخدم مسجل: تحديث ملفه الشخصي ──────────────────
  @Mutation(() => UpdateProfileOutput)
  updateProfile(
    @AuthUser() currentUser: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UpdateProfileOutput> {
    return this.usersService.updateProfile(currentUser, input);
  }

  // ─── أي مستخدم مسجل: تحديث موقعه ────────────────────────
  @Mutation(() => Boolean)
  updateMyLocation(
    @AuthUser() currentUser: User,
    @Args('input') input: UpdateLocationInput,
  ): Promise<boolean> {
    return this.usersService.updateLocation(currentUser, input);
  }

  // ─── Admin فقط: تفعيل/تعطيل حساب ────────────────────────
  @Roles(UserRole.ADMIN)
  @Mutation(() => UpdateProfileOutput)
  toggleUserActive(
    @Args('userId') userId: string,
    @AuthUser() adminUser: User,
  ): Promise<UpdateProfileOutput> {
    return this.usersService.toggleUserActive(userId, adminUser);
  }
}