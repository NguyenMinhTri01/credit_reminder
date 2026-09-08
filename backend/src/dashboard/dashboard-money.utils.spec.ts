import { Prisma } from '@prisma/client';
import {
  aggregateDashboardMoney,
  calculateUtilization,
  deriveUsedBalance,
  serializeMoney,
} from './dashboard-money.utils';

const money = (value: string) => new Prisma.Decimal(value);

describe('dashboard money utilities', () => {
  it('serializes monetary values without floating-point loss', () => {
    expect(serializeMoney(money('0.1').plus(money('0.2')))).toBe('0.30');
  });

  it('returns null utilization for missing and zero limits', () => {
    expect(calculateUtilization(money('20'), null)).toBeNull();
    expect(calculateUtilization(money('20'), money('0'))).toBeNull();
  });

  it('aggregates known limits while retaining all balances', () => {
    expect(
      aggregateDashboardMoney([
        {
          creditLimit: money('100000000'),
          currentBalance: money('25000000'),
          availableCredit: money('75000000'),
        },
        {
          creditLimit: money('50000000'),
          currentBalance: money('60000000'),
          availableCredit: money('-10000000'),
        },
        {
          creditLimit: null,
          currentBalance: money('5000000'),
          availableCredit: null,
        },
      ]),
    ).toEqual({
      cardCount: 3,
      totalCreditLimit: '150000000.00',
      totalCurrentBalance: '90000000.00',
      availableCredit: '65000000.00',
      utilizationPercent: 56.7,
      hasUnknownLimits: true,
    });
  });

  it('preserves negative balances and over-limit results', () => {
    expect(
      aggregateDashboardMoney([
        {
          creditLimit: money('100'),
          currentBalance: money('140'),
          availableCredit: money('-40'),
        },
        {
          creditLimit: money('50'),
          currentBalance: money('-10'),
          availableCredit: money('60'),
        },
      ]),
    ).toEqual({
      cardCount: 2,
      totalCreditLimit: '150.00',
      totalCurrentBalance: '130.00',
      availableCredit: '20.00',
      utilizationPercent: 86.7,
      hasUnknownLimits: false,
    });
  });

  it('derives used balance from credit limit and available credit', () => {
    const card = {
      creditLimit: money('50000'),
      currentBalance: money('0'),
      availableCredit: money('30000'),
    };

    expect(deriveUsedBalance(card)).toEqual(money('20000'));
    expect(aggregateDashboardMoney([card])).toEqual(
      expect.objectContaining({
        totalCurrentBalance: '20000.00',
        utilizationPercent: 40,
        availableCredit: '30000.00',
      }),
    );
  });

  it('ignores null availableCredit cards when summing available credit', () => {
    expect(
      aggregateDashboardMoney([
        {
          creditLimit: money('100'),
          currentBalance: money('40'),
          availableCredit: null,
        },
        {
          creditLimit: money('200'),
          currentBalance: money('50'),
          availableCredit: money('150'),
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        availableCredit: '150.00',
      }),
    );
  });

  it('excludes available credit from cards whose credit limit is unknown', () => {
    expect(
      aggregateDashboardMoney([
        { creditLimit: null, currentBalance: money('10'), availableCredit: money('90') },
        { creditLimit: money('100'), currentBalance: money('20'), availableCredit: money('80') },
      ]),
    ).toEqual(expect.objectContaining({ availableCredit: '80.00' }));
  });
});
