import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';



// Mock Repository — لا نتصل بقاعدة البيانات في Unit Tests
const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      JWT_ACCESS_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    };
    return config[key];
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let verificationRepo: jest.Mocked<Repository<Verification>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Verification),
          useFactory: mockRepository,
        },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    verificationRepo = module.get(getRepositoryToken(Verification));
  });

  // ─── اختبارات التسجيل ─────────────────────────────────────
  describe('register', () => {

    it('يجب أن ينشئ مستخدم جديد بنجاح', async () => {
      // Arrange — إعداد البيانات
      const input = {
        email: 'test@test.com',
        password: '123456',
        role: UserRole.CUSTOMER,
      };

      userRepo.findOne.mockResolvedValue(null);
      // ↑ الإيميل غير موجود

      const mockUser = { id: 'uuid-1', ...input };
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const mockVerification = { id: 'v-1', code: 'ABC123', user: mockUser };
      verificationRepo.create.mockReturnValue(mockVerification as any);
      verificationRepo.save.mockResolvedValue(mockVerification as any);

      // Act — تنفيذ العملية
      const result = await service.register(input as any);

      // Assert — التحقق من النتيجة
      expect(result.ok).toBe(true);
      expect(result.error).toBeUndefined();
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(verificationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('يجب أن يرفض الإيميل المكرر', async () => {
      // Arrange
      const existingUser = { id: 'uuid-1', email: 'test@test.com' };
      userRepo.findOne.mockResolvedValue(existingUser as any);

      // Act
      const result = await service.register({
        email: 'test@test.com',
        password: '123456',
        role: UserRole.CUSTOMER,
      } as any);

      // Assert
      expect(result.ok).toBe(false);
      expect(result.error).toBe('هذا البريد الإلكتروني مسجل مسبقاً');
      expect(userRepo.save).not.toHaveBeenCalled();
      // تأكد إن save لم يُستدعَ
    });
  });

  // ─── اختبارات تسجيل الدخول ───────────────────────────────
  describe('login', () => {

    it('يجب أن يرجع token عند بيانات صحيحة', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('123456', 10);
      const mockUser = {
        id: 'uuid-1',
        email: 'test@test.com',
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      };

      userRepo.findOne.mockResolvedValue(mockUser as any);

      const mockSetCookie = jest.fn();

      // Act
      const result = await service.login(
        { email: 'test@test.com', password: '123456' },
        mockSetCookie,
      );

      // Assert
      expect(result.ok).toBe(true);
      expect(result.accessToken).toBe('mock-token');
      expect(mockSetCookie).toHaveBeenCalledTimes(1);
      // تأكد إن الكوكي اتعبأت
    });

    it('يجب أن يرفض كلمة المرور الخاطئة', async () => {
      const hashedPassword = await bcrypt.hash('correct-pass', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        password: hashedPassword,
      } as any);

      const result = await service.login(
        { email: 'test@test.com', password: 'wrong-pass' },
        jest.fn(),
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('يجب أن يرفض المستخدم غير الموجود', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.login(
        { email: 'notfound@test.com', password: '123456' },
        jest.fn(),
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });
  });

  // ─── اختبارات التحقق من البريد ───────────────────────────
  describe('verifyEmail', () => {

    it('يجب أن يتحقق من البريد بكود صحيح', async () => {
      const mockUser = { id: 'uuid-1', isVerified: false };
      const mockVerification = { id: 'v-1', code: 'ABC123', user: mockUser };

      verificationRepo.findOne.mockResolvedValue(mockVerification as any);
      userRepo.save.mockResolvedValue({ ...mockUser, isVerified: true } as any);
      verificationRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.verifyEmail('ABC123');

      expect(result.ok).toBe(true);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: true }),
      );
      expect(verificationRepo.delete).toHaveBeenCalledWith('v-1');
    });

    it('يجب أن يرفض الكود الخاطئ', async () => {
      verificationRepo.findOne.mockResolvedValue(null);

      const result = await service.verifyEmail('WRONG');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('الكود غير صحيح أو منتهي الصلاحية');
    });
  });
});