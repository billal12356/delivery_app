import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './entities/user.entity';
import { UpdateProfileInput } from './dto/update-profile.dto';
import { UpdateLocationInput } from './dto/update-location.dto';
import { UpdateProfileOutput, GetUsersOutput } from './dto/users-output.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ─── جلب كل المستخدمين (Admin فقط) ──────────────────────
  async getAllUsers(): Promise<GetUsersOutput> {
    try {
      const users = await this.userRepo.find({
        order: { createdAt: 'DESC' },
      });
      return { ok: true, users };
    } catch {
      return { ok: false, error: 'فشل جلب المستخدمين' };
    }
  }

  // ─── جلب مستخدم بالـ ID ───────────────────────────────────
  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  // ─── تحديث الملف الشخصي ──────────────────────────────────
  async updateProfile(
    currentUser: User,
    input: UpdateProfileInput,
  ): Promise<UpdateProfileOutput> {
    try {
      // جلب بيانات المستخدم الكاملة من قاعدة البيانات
      const user = await this.userRepo.findOne({
        where: { id: currentUser.id },
      });

      if (!user) {
        return { ok: false, error: 'المستخدم غير موجود' };
      }

      // تحديث الحقول المُرسَلة فقط
      if (input.email && input.email !== user.email) {
        // تحقق إن الإيميل الجديد غير مستخدم
        const emailExists = await this.userRepo.findOne({
          where: { email: input.email },
        });
        if (emailExists) {
          return { ok: false, error: 'هذا البريد الإلكتروني مستخدم مسبقاً' };
        }
        user.email = input.email;
        user.isVerified = false;
        // ↑ عند تغيير الإيميل، يجب التحقق منه مجدداً
      }

      if (input.phone) user.phone = input.phone;
      if (input.profileImage) user.profileImage = input.profileImage;

      // تغيير كلمة المرور
      if (input.newPassword) {
        user.password = await bcrypt.hash(input.newPassword, 10);
      }

      const updatedUser = await this.userRepo.save(user);
      return { ok: true, user: updatedUser };

    } catch {
      return { ok: false, error: 'فشل تحديث الملف الشخصي' };
    }
  }

  // ─── تحديث موقع المستخدم ────────────────────────────────
  async updateLocation(
    currentUser: User,
    input: UpdateLocationInput,
  ): Promise<boolean> {
    try {
      await this.userRepo.update(currentUser.id, {
        lat: input.lat,
        lng: input.lng,
      });
      // update() أسرع من save() لأنه يحدث حقول محددة فقط
      return true;
    } catch {
      return false;
    }
  }

  // ─── تفعيل/تعطيل حساب (Admin) ────────────────────────────
  async toggleUserActive(
    targetId: string,
    adminUser: User,
  ): Promise<UpdateProfileOutput> {
    try {
      // تأكد إن المستدعي Admin
      if (adminUser.role !== UserRole.ADMIN) {
        return { ok: false, error: 'غير مصرح بهذه العملية' };
      }

      const user = await this.userRepo.findOne({ where: { id: targetId } });
      if (!user) {
        return { ok: false, error: 'المستخدم غير موجود' };
      }

      // لا يمكن تعطيل Admin آخر
      if (user.role === UserRole.ADMIN) {
        return { ok: false, error: 'لا يمكن تعطيل حساب Admin' };
      }

      user.isActive = !user.isActive;
      const updated = await this.userRepo.save(user);

      return { ok: true, user: updated };
    } catch {
      return { ok: false, error: 'فشل تحديث الحساب' };
    }
  }

  // ─── جلب السائقين المتاحين ───────────────────────────────
  async getAvailableDrivers(): Promise<User[]> {
    return this.userRepo.find({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
        isVerified: true,
      },
    });
  }
}