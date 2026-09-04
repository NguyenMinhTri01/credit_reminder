import { Prisma } from '@prisma/client';
import {
  aggregateDashboardMoney,
  calculateUtilization,
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
        { creditLimit: money('100000000'), currentBalance: money('25000000') },
        { creditLimit: money('50000000'), currentBalance: money('60000000') },
        { creditLimit: null, currentBalance: money('5000000') },
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
        { creditLimit: money('100'), currentBalance: money('140') },
        { creditLimit: money('50'), currentBalance: money('-10') },
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
});
