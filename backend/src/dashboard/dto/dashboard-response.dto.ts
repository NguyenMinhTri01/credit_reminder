import { ApiProperty } from '@nestjs/swagger';
import {
  IDashboardCard,
  IDashboardReminder,
  IDashboardSnapshot,
  IDashboardSummary,
} from '@/shared';

export class DashboardSummaryDto implements IDashboardSummary {
  @ApiProperty({ example: 3 })
  cardCount!: number;

  @ApiProperty({ example: '200000000.00', description: 'VND decimal string' })
  totalCreditLimit!: string;

  @ApiProperty({ example: '69000000.00', description: 'VND decimal string' })
  totalCurrentBalance!: string;

  @ApiProperty({ example: '131000000.00', description: 'VND decimal string' })
  availableCredit!: string;

  @ApiProperty({ example: 34.5, nullable: true, type: Number })
  utilizationPercent!: number | null;

  @ApiProperty({ example: false })
  hasUnknownLimits!: boolean;
}

export class DashboardCardDto implements IDashboardCard {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Vietcombank' })
  bankName!: string;

  @ApiProperty({ example: 'Platinum' })
  cardName!: string;

  @ApiProperty({ example: '1234', nullable: true, type: String })
  cardNumberMasked!: string | null;

  @ApiProperty({ example: '50000000.00', nullable: true, type: String })
  creditLimit!: string | null;

  @ApiProperty({ example: '12500000.00' })
  currentBalance!: string;

  @ApiProperty({ example: '37500000.00', nullable: true, type: String })
  availableCredit!: string | null;

  @ApiProperty({ example: 25, nullable: true, type: Number })
  utilizationPercent!: number | null;

  @ApiProperty({ example: '2026-09-15', nullable: true, type: String, format: 'date' })
  nextDueDate!: string | null;

  @ApiProperty({ example: 11, nullable: true, type: Number })
  daysUntilDue!: number | null;
}

export class DashboardReminderDto implements IDashboardReminder {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Thanh toán thẻ Platinum' })
  title!: string;

  @ApiProperty({ example: '12500000.00', nullable: true, type: String })
  amount!: string | null;

  @ApiProperty({ enum: ['MONTHLY', 'QUARTERLY', 'ONE_TIME'], nullable: true })
  frequency!: 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME' | null;

  @ApiProperty({ example: '2026-09-15', format: 'date' })
  nextTriggerDate!: string;
}

export class DashboardSnapshotDto implements IDashboardSnapshot {
  @ApiProperty({ example: '2026-09-04T10:00:00.000Z', format: 'date-time' })
  generatedAt!: string;

  @ApiProperty({ type: DashboardSummaryDto })
  summary!: DashboardSummaryDto;

  @ApiProperty({ type: DashboardCardDto, isArray: true })
  cards!: DashboardCardDto[];

  @ApiProperty({ type: DashboardReminderDto, isArray: true })
  upcomingReminders!: DashboardReminderDto[];
}
