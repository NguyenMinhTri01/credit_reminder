import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import {
  IsCalendarDateString,
  IsDecimal15_2String,
  IsPositiveDecimalString,
  TRANSACTION_MESSAGES,
} from '@/shared';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    example: 'PAYMENT',
    enum: ['EXPENSE', 'PAYMENT', 'REFUND'],
    description: 'Transaction type',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(['EXPENSE', 'PAYMENT', 'REFUND'], { message: TRANSACTION_MESSAGES.TYPE_INVALID })
  readonly type?: 'EXPENSE' | 'PAYMENT' | 'REFUND';

  @ApiPropertyOptional({
    example: '7000000.00',
    description: 'Transaction amount as decimal string (VND)',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDecimal15_2String({ message: TRANSACTION_MESSAGES.AMOUNT_FORMAT })
  @IsPositiveDecimalString({ message: TRANSACTION_MESSAGES.AMOUNT_POSITIVE })
  readonly amount?: string;

  @ApiPropertyOptional({
    example: '2026-09-06',
    description: 'Transaction date in YYYY-MM-DD format',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsCalendarDateString({ message: TRANSACTION_MESSAGES.DATE_FORMAT })
  readonly transactionDate?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Transaction description',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    example: 'New merchant',
    description: 'Merchant name',
  })
  @IsOptional()
  @IsString()
  readonly merchant?: string;
}
