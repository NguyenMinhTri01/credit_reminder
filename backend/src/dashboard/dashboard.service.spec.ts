import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DashboardService } from './dashboard.service';

const money = (value: string) => new Prisma.Decimal(value);
const now = new Date('2026-09-04T05:00:00.000Z');

describe('DashboardService', () => {
  const prisma = {
    creditCard: { findMany: jest.fn() },
    reminder: { findMany: jest.fn() },
  };
  const config = { get: jest.fn((_key: string, fallback: string) => fallback) };
  const service = new DashboardService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns a complete snapshot and scopes both queries to the user', async () => {
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-1',
        bankName: 'VCB',
        cardName: 'Platinum',
        cardNumberMasked: '1234',
        creditLimit: money('50000000'),
        currentBalance: money('12500000'),
        dueDay: 15,
      },
    ]);
    prisma.reminder.findMany.mockResolvedValue([
      {
        id: 'reminder-1',
        title: 'Pay card',
        amount: money('12500000'),
        frequency: 'MONTHLY',
        nextTriggerDate: new Date('2026-09-15T00:00:00.000Z'),
      },
    ]);

    const result = await service.getSnapshot('user-1', now);

    expect(prisma.creditCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(prisma.reminder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          isActive: true,
          nextTriggerDate: { gte: expect.any(Date) },
        }),
        take: 5,
      }),
    );
    expect(result).toEqual({
      generatedAt: now.toISOString(),
      summary: {
        cardCount: 1,
        totalCreditLimit: '50000000.00',
        totalCurrentBalance: '12500000.00',
        availableCredit: '37500000.00',
        utilizationPercent: 25,
        hasUnknownLimits: false,
      },
      cards: [
        {
          id: 'card-1',
          bankName: 'VCB',
          cardName: 'Platinum',
          cardNumberMasked: '1234',
          creditLimit: '50000000.00',
          currentBalance: '12500000.00',
          availableCredit: '37500000.00',
          utilizationPercent: 25,
          nextDueDate: '2026-09-15',
          daysUntilDue: 11,
        },
      ],
      upcomingReminders: [
        {
          id: 'reminder-1',
          title: 'Pay card',
          amount: '12500000.00',
          frequency: 'MONTHLY',
          nextTriggerDate: '2026-09-15',
        },
      ],
    });
  });

  it('returns safe empty values', async () => {
    prisma.creditCard.findMany.mockResolvedValue([]);
    prisma.reminder.findMany.mockResolvedValue([]);
    const result = await service.getSnapshot('user-empty', now);
    expect(result.summary).toEqual({
      cardCount: 0,
      totalCreditLimit: '0.00',
      totalCurrentBalance: '0.00',
      availableCredit: '0.00',
      utilizationPercent: null,
      hasUnknownLimits: false,
    });
    expect(result.cards).toEqual([]);
    expect(result.upcomingReminders).toEqual([]);
  });

  it('maps optional card and reminder fields without inventing values', async () => {
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-2',
        bankName: 'ACB',
        cardName: 'Travel',
        cardNumberMasked: null,
        creditLimit: null,
        currentBalance: money('10'),
        dueDay: null,
      },
    ]);
    prisma.reminder.findMany.mockResolvedValue([
      {
        id: 'reminder-2',
        title: 'Optional',
        amount: null,
        frequency: null,
        nextTriggerDate: new Date('2026-10-01T00:00:00.000Z'),
      },
    ]);
    const result = await service.getSnapshot('user-2', now);
    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        cardNumberMasked: null,
        creditLimit: null,
        availableCredit: null,
        utilizationPercent: null,
        nextDueDate: null,
        daysUntilDue: null,
      }),
    );
    expect(result.upcomingReminders[0].amount).toBeNull();
  });
});
