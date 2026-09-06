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
        bankCode: 'vietcombank',
        bankName: 'Vietcombank',
        cardName: 'Platinum',
        lastFourDigits: '1234',
        cardNumberMasked: '1234',
        creditLimit: money('50000000'),
        currentBalance: money('12500000'),
        availableCredit: money('37500000'),
        dueDay: 15,
        statementDay: null,
        paymentDueDaysAfterStatement: null,
        expiryMonth: 12,
        expiryYear: 2028,
        deletedAt: null,
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
      expect.objectContaining({ where: { userId: 'user-1', deletedAt: null } }),
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
          bankName: 'Vietcombank',
          bankCode: 'vietcombank',
          bankShortName: 'Vietcombank',
          logoPath: '/images/banks/vietcombank.svg',
          cardName: 'Platinum',
          lastFourDigits: '1234',
          cardNumberMasked: '1234',
          creditLimit: '50000000.00',
          currentBalance: '12500000.00',
          availableCredit: '37500000.00',
          utilizationPercent: 25,
          nextDueDate: '2026-09-15',
          daysUntilDue: 11,
          statementDate: '2026-09-15',
          expiryStatus: 'valid',
          expiryMonth: 12,
          expiryYear: 2028,
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

  it('derives card used balance and utilization from available credit', async () => {
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-derived-balance',
        bankCode: null,
        bankName: 'VCB',
        cardName: 'Visa',
        lastFourDigits: '1234',
        cardNumberMasked: '1234',
        creditLimit: money('100'),
        currentBalance: money('0'),
        availableCredit: money('60'),
        dueDay: null,
        statementDay: null,
        paymentDueDaysAfterStatement: null,
        expiryMonth: null,
        expiryYear: null,
        deletedAt: null,
      },
    ]);
    prisma.reminder.findMany.mockResolvedValue([]);

    const result = await service.getSnapshot('user-derived-balance', now);

    expect(result.summary).toEqual(
      expect.objectContaining({
        totalCurrentBalance: '40.00',
        utilizationPercent: 40,
      }),
    );
    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        currentBalance: '40.00',
        availableCredit: '60.00',
        utilizationPercent: 40,
      }),
    );
  });

  it('maps optional card and reminder fields without inventing values', async () => {
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-2',
        bankCode: null,
        bankName: 'ACB',
        cardName: 'Travel',
        lastFourDigits: null,
        cardNumberMasked: null,
        creditLimit: null,
        currentBalance: money('10'),
        availableCredit: null,
        dueDay: null,
        statementDay: null,
        paymentDueDaysAfterStatement: null,
        expiryMonth: null,
        expiryYear: null,
        deletedAt: null,
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
        bankCode: null,
        bankShortName: null,
        logoPath: null,
        lastFourDigits: null,
        cardNumberMasked: null,
        creditLimit: null,
        availableCredit: null,
        utilizationPercent: null,
        nextDueDate: null,
        daysUntilDue: null,
        statementDate: null,
        expiryStatus: null,
        expiryMonth: null,
        expiryYear: null,
      }),
    );
    expect(result.upcomingReminders[0].amount).toBeNull();
  });

  it('excludes soft-deleted cards from the query', async () => {
    prisma.creditCard.findMany.mockResolvedValue([]);
    prisma.reminder.findMany.mockResolvedValue([]);

    await service.getSnapshot('user-deleted', now);

    expect(prisma.creditCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it('computes expiry status for a card expiring within 3 months', async () => {
    // now = 2026-09-04, card expires 2026-11-30 → warning starts 2026-08-31 → expiring_soon
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-expiry',
        bankCode: null,
        bankName: 'VCB',
        cardName: 'Visa',
        lastFourDigits: '9999',
        cardNumberMasked: '9999',
        creditLimit: money('10000'),
        currentBalance: money('0'),
        availableCredit: money('10000'),
        dueDay: null,
        statementDay: null,
        paymentDueDaysAfterStatement: null,
        expiryMonth: 11,
        expiryYear: 2026,
        deletedAt: null,
      },
    ]);
    prisma.reminder.findMany.mockResolvedValue([]);

    const result = await service.getSnapshot('user-expiry', now);

    expect(result.cards[0].expiryStatus).toBe('expiring_soon');
    expect(result.cards[0].expiryMonth).toBe(11);
    expect(result.cards[0].expiryYear).toBe(2026);
  });

  it('uses calculateNextPaymentDue with statement-cycle fields when provided', async () => {
    // statementDay=5, paymentDueDaysAfterStatement=15, today=Sept 4
    // Statement close Sept 5 is in the future (Sept 5 > Sept 4), so use Aug 5 as last statement.
    // Aug 5 + 15 days = Aug 20 → already past Sept 4.
    // Advance to next cycle: Sept 5 statement + 15 days = Sept 20 due date.
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-schedule',
        bankCode: null,
        bankName: 'VCB',
        cardName: 'Visa',
        lastFourDigits: '5678',
        cardNumberMasked: '5678',
        creditLimit: money('10000'),
        currentBalance: money('1000'),
        availableCredit: money('9000'),
        dueDay: null,
        statementDay: 5,
        paymentDueDaysAfterStatement: 15,
        expiryMonth: null,
        expiryYear: null,
        deletedAt: null,
      },
    ]);
    prisma.reminder.findMany.mockResolvedValue([]);

    const result = await service.getSnapshot('user-schedule', now);

    expect(result.cards[0].statementDate).toBe('2026-09-05');
    expect(result.cards[0].nextDueDate).toBe('2026-09-20');
    expect(result.cards[0].daysUntilDue).toBe(16);
  });
});
