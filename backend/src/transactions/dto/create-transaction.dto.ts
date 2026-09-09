import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  IsCalendarDateString,
  IsDecimal15_2String,
  IsPositiveDecimalString,
  TRANSACTION_MESSAGES,
} from '@/shared';

export class CreateTransactionDto {
  @ApiProperty({
    example: 'EXPENSE',
    enum: ['EXPENSE', 'PAYMENT', 'REFUND'],
    description: 'Transaction type (ADJUSTMENT is system-only)',
  })
  @IsEnum(['EXPENSE', 'PAYMENT', 'REFUND'], { message: TRANSACTION_MESSAGES.TYPE_INVALID })
  readonly type: 'EXPENSE' | 'PAYMENT' | 'REFUND';

  @ApiProperty({
    example: '5000000.00',
    description: 'Transaction amount as decimal string (VND)',
  })
  @IsNotEmpty({ message: TRANSACTION_MESSAGES.AMOUNT_REQUIRED })
  @IsDecimal15_2String({ message: TRANSACTION_MESSAGES.AMOUNT_FORMAT })
  @IsPositiveDecimalString({ message: TRANSACTION_MESSAGES.AMOUNT_POSITIVE })
  readonly amount: string;

  @ApiProperty({
    example: '2026-09-05',
    description: 'Transaction date in YYYY-MM-DD format',
  })
  @IsNotEmpty({ message: TRANSACTION_MESSAGES.DATE_REQUIRED })
  @IsCalendarDateString({ message: TRANSACTION_MESSAGES.DATE_FORMAT })
  readonly transactionDate: string;

  @ApiPropertyOptional({
    example: 'Grocery shopping',
    description: 'Transaction description',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    example: 'Vinmart',
    description: 'Merchant name',
  })
  @IsOptional()
  @IsString()
  readonly merchant?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Idempotency key to prevent duplicate transactions',
  })
  @IsOptional()
  @IsUUID('4', { message: TRANSACTION_MESSAGES.IDEMPOTENCY_KEY_FORMAT })
  readonly idempotencyKey?: string;
}
