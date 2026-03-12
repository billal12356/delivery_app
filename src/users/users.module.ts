import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // نسجل User Entity عشان نقدر نستخدم Repository
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
  // export UsersService عشان الموديولات الثانية
  // مثل OrdersModule تقدر تستخدمه
})
export class UsersModule {}