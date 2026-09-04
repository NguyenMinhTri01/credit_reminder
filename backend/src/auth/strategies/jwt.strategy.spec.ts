import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '@/prisma/prisma.service';
import { AUTH_MESSAGES } from '@/shared';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return sanitized user for valid payload', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
    });

    const result = await strategy.validate({ sub: '1', email: 'test@example.com' });

    expect(result).toEqual({ id: '1', email: 'test@example.com', fullName: 'Test User' });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'missing', email: 'a@b.com' })).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.UNAUTHORIZED),
    );
  });
});
