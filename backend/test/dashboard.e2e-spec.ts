import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { DashboardController } from '@/dashboard/dashboard.controller';
import { DashboardService } from '@/dashboard/dashboard.service';
import { PrismaService } from '@/prisma/prisma.service';

const TEST_SECRET = 'dashboard-e2e-secret';

describe('Dashboard API (e2e)', () => {
  let app: INestApplication;
  const users = new Map([
    ['user-1', { id: 'user-1', email: 'one@example.com', fullName: 'One' }],
    ['user-2', { id: 'user-2', email: 'two@example.com', fullName: 'Two' }],
  ]);
  const cards = [
    {
      id: 'card-1',
      userId: 'user-1',
      bankName: 'VCB',
      cardName: 'Platinum',
      cardNumberMasked: '1111',
      creditLimit: new Prisma.Decimal('100'),
      currentBalance: new Prisma.Decimal('25'),
      dueDay: 15,
    },
    {
      id: 'card-2',
      userId: 'user-2',
      bankName: 'ACB',
      cardName: 'Travel',
      cardNumberMasked: '2222',
      creditLimit: new Prisma.Decimal('200'),
      currentBalance: new Prisma.Decimal('50'),
      dueDay: 20,
    },
  ];
  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => users.get(where.id) ?? null),
    },
    creditCard: {
      findMany: jest.fn(({ where }: { where: { userId: string } }) =>
        cards.filter((card) => card.userId === where.userId),
      ),
    },
    reminder: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeAll(async () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'JWT_SECRET' ? TEST_SECRET : fallback,
      ),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return TEST_SECRET;
        throw new Error(`Missing ${key}`);
      }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [DashboardController],
      providers: [
        DashboardService,
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => app.close());

  it('returns 401 without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/dashboard').expect(401);
  });

  it('returns only cards owned by the authenticated user', async () => {
    const token = new JwtService({ secret: TEST_SECRET }).sign({
      sub: 'user-1',
      email: 'one@example.com',
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.summary.cardCount).toBe(1);
    expect(response.body.cards).toHaveLength(1);
    expect(response.body.cards[0].id).toBe('card-1');
    expect(response.body.cards).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'card-2' })]),
    );
  });
});
