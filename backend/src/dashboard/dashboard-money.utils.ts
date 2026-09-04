import { Prisma } from '@prisma/client';
import { IDashboardSummary } from '@/shared';

export interface DashboardMoneyCard {
  creditLimit: Prisma.Decimal | null;
  currentBalance: Prisma.Decimal;
}

export function serializeMoney(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

export function calculateUtilization(
  balance: Prisma.Decimal,
  limit: Prisma.Decimal | null,
): number | null {
  if (limit === null || limit.isZero()) return null;
  return balance.dividedBy(limit).times(100).toDecimalPlaces(1).toNumber();
}

export function aggregateDashboardMoney(cards: DashboardMoneyCard[]): IDashboardSummary {
  let totalCreditLimit = new Prisma.Decimal(0);
  let totalCurrentBalance = new Prisma.Decimal(0);
  let knownLimitBalance = new Prisma.Decimal(0);
  let availableCredit = new Prisma.Decimal(0);
  let hasUnknownLimits = false;

  for (const card of cards) {
    totalCurrentBalance = totalCurrentBalance.plus(card.currentBalance);
    if (card.creditLimit === null) {
      hasUnknownLimits = true;
      continue;
    }

    totalCreditLimit = totalCreditLimit.plus(card.creditLimit);
    knownLimitBalance = knownLimitBalance.plus(card.currentBalance);
    availableCredit = availableCredit.plus(card.creditLimit.minus(card.currentBalance));
  }

  return {
    cardCount: cards.length,
    totalCreditLimit: serializeMoney(totalCreditLimit),
    totalCurrentBalance: serializeMoney(totalCurrentBalance),
    availableCredit: serializeMoney(availableCredit),
    utilizationPercent: calculateUtilization(knownLimitBalance, totalCreditLimit),
    hasUnknownLimits,
  };
}
