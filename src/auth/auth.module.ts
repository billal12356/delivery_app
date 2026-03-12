import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/entities/user.entity';
import { Verification } from '../users/entities/verification.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    // TypeORM — نسجل الـ Entities اللي يحتاجها هذا الموديول
    TypeOrmModule.forFeature([User, Verification]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // إعداد JWT بشكل async لقراءة الـ secret من .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') as string,
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '1d') as any,
        },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy,JwtAuthGuard],
  exports: [JwtAuthGuard, JwtStrategy, PassportModule],
  // exports عشان الموديولات الثانية تقدر تستخدم الـ Guard
})
export class AuthModule {}