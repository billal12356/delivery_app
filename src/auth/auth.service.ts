import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Verification } from '../users/entities/verification.entity';
import { RegisterInput } from './dto/register.dto';
import { LoginInput } from './dto/login.dto';
import {
  RegisterOutput,
  LoginOutput,
  VerifyEmailOutput,
  RefreshOutput,
} from './dto/auth-output.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Verification)
    private readonly verificationRepo: Repository<Verification>,

    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ccess Token
  private generateAccessToken(userId: string): string {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  // Refresh Token
  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { id: userId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }
  // Register
  async register(input: RegisterInput): Promise<RegisterOutput> {
    try {
      const exists = await this.userRepo.findOne({
        where: { email: input.email },
      });

      if (exists) {
        return { ok: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً' };
      }

      const user = this.userRepo.create(input);
      await this.userRepo.save(user);

      const verification = this.verificationRepo.create({ user });
      await this.verificationRepo.save(verification);

      console.log(
        `📧 Verification code for ${user.email}: ${verification.code}`,
      );

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
    }
  }

  // تسجيل الدخول
  async login(
    input: LoginInput,
    setRefreshTokenCookie: (token: string) => void,
  ): Promise<LoginOutput> {
    try {
      const user = await this.userRepo.findOne({
        where: { email: input.email },
      });

      if (!user) {
        return {
          ok: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
      }

      const isMatch = await bcrypt.compare(input.password, user.password);
      if (!isMatch) {
        return {
          ok: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
      }

      // توليد الـ Tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // وضع Refresh Token في HttpOnly Cookie
      setRefreshTokenCookie(refreshToken);

      return { ok: true, accessToken };
    } catch (error) {
      return { ok: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  }

  //Access Token
  async refreshAccessToken(refreshToken: string): Promise<RefreshOutput> {
    try {
      if (!refreshToken) {
        return { ok: false, error: 'لا يوجد Refresh Token' };
      }

      // تحقق من صحة الـ Refresh Token
      const payload = this.jwtService.verify<{ id: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // تأكد إن المستخدم لا يزال موجوداً
      const user = await this.userRepo.findOne({
        where: { id: payload.id },
      });

      if (!user) {
        return { ok: false, error: 'المستخدم غير موجود' };
      }

      // أنشئ Access Token جديد
      const accessToken = this.generateAccessToken(user.id);

      return { ok: true, accessToken };
    } catch (error) {
      return { ok: false, error: 'Refresh Token منتهي أو غير صحيح' };
    }
  }

  // ─── تسجيل الخروج ────────────────────────────────────────
  logout(clearCookie: () => void): { ok: boolean } {
    clearCookie(); // امسح الكوكي
    return { ok: true };
  }

  // ─── التحقق من البريد ────────────────────────────────────
  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verificationRepo.findOne({
        where: { code },
        relations: ['user'],
      });

      if (!verification) {
        return { ok: false, error: 'الكود غير صحيح أو منتهي الصلاحية' };
      }

      verification.user.isVerified = true;
      await this.userRepo.save(verification.user);
      await this.verificationRepo.delete(verification.id);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'حدث خطأ أثناء التحقق' };
    }
  }

  async getMe(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }
}