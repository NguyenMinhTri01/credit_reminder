import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AUTH_MESSAGES } from '@/shared';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { compare } from 'bcryptjs';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-value'),
  getOrThrow: jest.fn().mockReturnValue('test-value'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = { email: 'test@example.com', password: 'StrongP@ss1', fullName: 'Test User' };

    it('should register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1', email: dto.email, fullName: dto.fullName, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.register(dto);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'StrongP@ss1' };

    it('should login with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1', email: dto.email, passwordHash: 'hashed', fullName: 'Test',
      });
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1', email: dto.email, passwordHash: 'hashed', fullName: 'Test',
      });
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should return success message even if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'test@example.com' });
      expect(result.message).toBe(AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
    });

    it('should generate reset token for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'test@example.com' });
      expect(result.message).toBe(AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException with invalid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid', newPassword: 'NewP@ss123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password with valid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: '1' });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.resetPassword({ token: 'valid', newPassword: 'NewP@ss123' });
      expect(result.message).toBe(AUTH_MESSAGES.RESET_PASSWORD_SUCCESS);
    });
  });
});
