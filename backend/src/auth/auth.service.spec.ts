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
        id: '1',
        email: dto.email,
        fullName: dto.fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        id: '1',
        email: dto.email,
        passwordHash: 'hashed',
        fullName: 'Test',
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
        id: '1',
        email: dto.email,
        passwordHash: 'hashed',
        fullName: 'Test',
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

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (mockJwtService as Record<string, jest.Mock>)['verifyAsync'] = jest
        .fn()
        .mockResolvedValue({ sub: '1', email: 'test@example.com', type: 'refresh' });

      const result = await service.refreshToken('valid-refresh-token');

      expect((mockJwtService as Record<string, jest.Mock>)['verifyAsync']).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({ secret: 'test-value' }),
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.accessToken).not.toBe(result.refreshToken);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      (mockJwtService as Record<string, jest.Mock>)['verifyAsync'] = jest
        .fn()
        .mockRejectedValue(new Error('invalid token'));

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      (mockJwtService as Record<string, jest.Mock>)['verifyAsync'] = jest
        .fn()
        .mockResolvedValue({ sub: '1', email: 'test@example.com', type: 'access' });

      await expect(service.refreshToken('access-token-as-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('googleAuth', () => {
    const googleUser = { sub: 'g-1', email: 'g@example.com', name: 'Google User' };

    beforeEach(() => {
      // verifyGoogleToken is private; mock the underlying google client.
      const googleClient = (service as unknown as { googleClient: { verifyIdToken: jest.Mock } })
        .googleClient;
      googleClient.verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ sub: googleUser.sub, email: googleUser.email, name: googleUser.name }),
      });
    });

    it('should create a new user when none exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // by googleId
        .mockResolvedValueOnce(null); // by email
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: googleUser.email,
        fullName: googleUser.name,
        googleId: googleUser.sub,
      });

      const result = await service.googleAuth({ idToken: 'valid-token' });

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should link googleId to existing user found by email', async () => {
      const existing = { id: '2', email: googleUser.email, fullName: 'Old Name' };
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // by googleId
        .mockResolvedValueOnce(existing); // by email
      mockPrismaService.user.update.mockResolvedValue({
        ...existing,
        googleId: googleUser.sub,
      });

      const result = await service.googleAuth({ idToken: 'valid-token' });

      expect(result.user).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should return existing user found by googleId', async () => {
      const existing = {
        id: '3',
        email: googleUser.email,
        fullName: googleUser.name,
        googleId: googleUser.sub,
      };
      mockPrismaService.user.findUnique.mockResolvedValueOnce(existing);

      const result = await service.googleAuth({ idToken: 'valid-token' });

      expect(result.user).toBeDefined();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when google token verification fails', async () => {
      const googleClient = (service as unknown as { googleClient: { verifyIdToken: jest.Mock } })
        .googleClient;
      googleClient.verifyIdToken = jest.fn().mockRejectedValue(new Error('invalid'));

      await expect(service.googleAuth({ idToken: 'bad-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when payload is missing email', async () => {
      const googleClient = (service as unknown as { googleClient: { verifyIdToken: jest.Mock } })
        .googleClient;
      googleClient.verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ sub: 'g-1' }),
      });

      await expect(service.googleAuth({ idToken: 'token' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
