import { ApiProperty } from '@nestjs/swagger';
import { CardType } from '@prisma/client';
import { ICreditCard, IScheduleInfo } from '@/shared';
import { CARD_TYPE_VALUES } from '@/shared';

// ─── Nested DTOs ─────────────────────────────────────────────

export class ScheduleInfoDto implements IScheduleInfo {
  @ApiProperty({ example: '2026-09-25', nullable: true, type: String, format: 'date' })
  statementDate!: string | null;

  @ApiProperty({ example: '2026-10-16', nullable: true, type: String, format: 'date' })
  nextDueDate!: string | null;

  @ApiProperty({ example: 12, nullable: true, type: Number })
  daysUntilDue!: number | null;
}

// ─── Main Response DTO ────────────────────────────────────────

export class CreditCardResponseDto implements ICreditCard {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  userId!: string;

  @ApiProperty({ example: 'vietcombank', nullable: true, type: String })
  bankCode!: string | null;

  @ApiProperty({
    enum: CARD_TYPE_VALUES,
    enumName: 'CardType',
    example: CardType.VISA,
    nullable: true,
    type: String,
  })
  cardType!: CardType | null;

  @ApiProperty({ example: 'Ngân hàng TMCP Ngoại thương Việt Nam' })
  bankName!: string;

  @ApiProperty({ example: 'Vietcombank', nullable: true, type: String })
  bankShortName!: string | null;

  @ApiProperty({ example: '/images/banks/vietcombank.svg', nullable: true, type: String })
  logoPath!: string | null;

  @ApiProperty({ example: 'Platinum Rewards' })
  cardName!: string;

  @ApiProperty({ example: '1234', nullable: true, type: String })
  lastFourDigits!: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  cardNumberMasked!: string | null;

  @ApiProperty({ example: '50000000.00', nullable: true, type: String })
  creditLimit!: string | null;

  @ApiProperty({ example: '37500000.00', nullable: true, type: String })
  availableCredit!: string | null;

  @ApiProperty({ example: 25.0, nullable: true, type: Number })
  utilizationPercent!: number | null;

  @ApiProperty({ example: 25, nullable: true, type: Number })
  statementDay!: number | null;

  @ApiProperty({ example: 21, nullable: true, type: Number })
  paymentDueDaysAfterStatement!: number | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  dueDay!: number | null;

  @ApiProperty({ example: 12, nullable: true, type: Number })
  expiryMonth!: number | null;

  @ApiProperty({ example: 2028, nullable: true, type: Number })
  expiryYear!: number | null;

  @ApiProperty({
    example: 'valid',
    enum: ['valid', 'expiring_soon', 'expired'],
    nullable: true,
  })
  expiryStatus!: 'valid' | 'expiring_soon' | 'expired' | null;

  @ApiProperty({ type: ScheduleInfoDto })
  scheduleInfo!: ScheduleInfoDto;

  @ApiProperty({ example: '2026-08-01T12:00:00.000Z', nullable: true, type: String })
  lastReconciledAt!: string | null;

  @ApiProperty({ example: null, nullable: true, type: String })
  deletedAt!: string | null;

  @ApiProperty({ example: '2026-01-15T08:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-01T12:00:00.000Z' })
  updatedAt!: string;
}

// ─── List / Delete Response DTOs ─────────────────────────────

export class CreditCardListResponseDto {
  @ApiProperty({ type: CreditCardResponseDto, isArray: true })
  data!: CreditCardResponseDto[];
}

export class DeleteResponseDto {
  @ApiProperty({ example: 'Credit card deleted successfully' })
  message!: string;
}
