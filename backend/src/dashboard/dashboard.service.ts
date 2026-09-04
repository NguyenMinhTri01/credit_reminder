import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { IDashboardSnapshot } from '@/shared';
import { calculateNextDueDate, DEFAULT_APP_TIME_ZONE, getTodayIso } from './dashboard-date.utils';
import {
  aggregateDashboardMoney,
  calculateUtilization,
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
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          bankName: true,
          cardName: true,
          cardNumberMasked: true,
          creditLimit: true,
          currentBalance: true,
          dueDay: true,
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
        const due = calculateNextDueDate(card.dueDay, now, timeZone);
        return {
          id: card.id,
          bankName: card.bankName,
          cardName: card.cardName,
          cardNumberMasked: card.cardNumberMasked,
          creditLimit: card.creditLimit === null ? null : serializeMoney(card.creditLimit),
          currentBalance: serializeMoney(card.currentBalance),
          availableCredit:
            card.creditLimit === null
              ? null
              : serializeMoney(card.creditLimit.minus(card.currentBalance)),
          utilizationPercent: calculateUtilization(card.currentBalance, card.creditLimit),
          nextDueDate: due?.nextDueDate ?? null,
          daysUntilDue: due?.daysUntilDue ?? null,
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
