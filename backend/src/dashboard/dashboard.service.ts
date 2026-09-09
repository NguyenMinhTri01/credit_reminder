import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { IDashboardSnapshot } from '@/shared';
import { calculateNextPaymentDue } from '@/shared/utils/schedule.utils';
import { getExpiryStatus } from '@/shared/utils/expiry.utils';
import { findBankByCode } from '@/shared/constants/bank-catalog';
import { DEFAULT_APP_TIME_ZONE, getTodayIso } from './dashboard-date.utils';
import {
  aggregateDashboardMoney,
  calculateUtilization,
  deriveUsedBalance,
  serializeMoney,
} from './dashboard-money.utils';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSnapshot(userId: string, now = new Date()): Promise<IDashboardSnapshot> {
    const timeZone = this.configService.get<string>('APP_TIME_ZONE', DEFAULT_APP_TIME_ZONE);
    const today = getTodayIso(now, timeZone);

    const [cards, reminders] = await Promise.all([
      this.prisma.creditCard.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          bankCode: true,
          bankName: true,
          cardName: true,
          lastFourDigits: true,
          cardNumberMasked: true,
          creditLimit: true,
          currentBalance: true,
          availableCredit: true,
          dueDay: true,
          statementDay: true,
          paymentDueDaysAfterStatement: true,
          expiryMonth: true,
          expiryYear: true,
        },
      }),
      this.prisma.reminder.findMany({
        where: {
          userId,
          isActive: true,
          nextTriggerDate: { gte: new Date(`${today}T00:00:00.000Z`) },
        },
        orderBy: [{ nextTriggerDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          amount: true,
          frequency: true,
          nextTriggerDate: true,
        },
      }),
    ]);

    return {
      generatedAt: now.toISOString(),
      summary: aggregateDashboardMoney(cards),
      cards: cards.map((card) => {
        const scheduleInfo = calculateNextPaymentDue(
          card.statementDay,
          card.paymentDueDaysAfterStatement,
          card.dueDay,
          now,
          timeZone,
        );
        const expiryInfo = getExpiryStatus(card.expiryMonth, card.expiryYear, now, timeZone);
        const bank = card.bankCode != null ? findBankByCode(card.bankCode) : undefined;
        const usedBalance = deriveUsedBalance(card);

        return {
          id: card.id,
          bankName: card.bankName,
          bankCode: card.bankCode ?? null,
          bankShortName: bank?.shortName ?? null,
          logoPath: bank?.logoPath ?? null,
          cardName: card.cardName,
          lastFourDigits: card.lastFourDigits ?? null,
          cardNumberMasked: card.cardNumberMasked ?? null,
          creditLimit: card.creditLimit === null ? null : serializeMoney(card.creditLimit),
          currentBalance: serializeMoney(usedBalance),
          availableCredit:
            card.creditLimit === null || card.availableCredit === null
              ? null
              : serializeMoney(card.availableCredit),
          utilizationPercent: calculateUtilization(usedBalance, card.creditLimit),
          nextDueDate: scheduleInfo?.nextDueDate ?? null,
          daysUntilDue: scheduleInfo?.daysUntilDue ?? null,
          statementDate: scheduleInfo?.statementDate ?? null,
          expiryStatus: expiryInfo?.status ?? null,
          expiryMonth: card.expiryMonth ?? null,
          expiryYear: card.expiryYear ?? null,
        };
      }),
      upcomingReminders: reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        amount: reminder.amount === null ? null : serializeMoney(reminder.amount),
        frequency: reminder.frequency,
        nextTriggerDate: reminder.nextTriggerDate.toISOString().slice(0, 10),
      })),
    };
  }
}
