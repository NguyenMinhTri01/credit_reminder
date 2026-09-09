import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';
import {
  CREDIT_CARD_MESSAGES,
  IsCurrentOrFutureYear,
  IsDecimal15_2String,
  IsPositiveDecimalString,
  MAX_EXPIRY_YEAR,
  MAX_PAYMENT_DUE_DAYS_AFTER_STATEMENT,
} from '@/shared';

// ─── DTO ─────────────────────────────────────────────────────

export class UpdateCreditCardDto {
  @ApiPropertyOptional({
    example: 'vietcombank',
    description: 'Bank code from the supported catalog',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString({ message: CREDIT_CARD_MESSAGES.BANK_CODE_REQUIRED })
  readonly bankCode?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'Last 4 digits of the card',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Matches(/^\d{4}$/, { message: CREDIT_CARD_MESSAGES.LAST_FOUR_DIGITS_FORMAT })
  readonly lastFourDigits?: string;

  @ApiPropertyOptional({
    example: '60000000.00',
    description: 'New credit limit as decimal string (VND)',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDecimal15_2String({ message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_FORMAT })
  @IsPositiveDecimalString({ message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_POSITIVE })
  readonly creditLimit?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Statement closing day of month (1–31)',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  @Max(31, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  readonly statementDay?: number;

  @ApiPropertyOptional({
    example: 21,
    description: 'Number of grace-period days after statement close',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.PAYMENT_DUE_DAYS_POSITIVE })
  @Max(MAX_PAYMENT_DUE_DAYS_AFTER_STATEMENT, {
    message: CREDIT_CARD_MESSAGES.PAYMENT_DUE_DAYS_RANGE,
  })
  readonly paymentDueDaysAfterStatement?: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Expiry month (1–12)',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.EXPIRY_MONTH_RANGE })
  @Max(12, { message: CREDIT_CARD_MESSAGES.EXPIRY_MONTH_RANGE })
  readonly expiryMonth?: number;

  @ApiPropertyOptional({
    example: 2028,
    description: 'Expiry year (current year or later)',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @IsCurrentOrFutureYear({ message: CREDIT_CARD_MESSAGES.EXPIRY_YEAR_MIN })
  @Max(MAX_EXPIRY_YEAR, { message: CREDIT_CARD_MESSAGES.EXPIRY_YEAR_MAX })
  readonly expiryYear?: number;

  @ApiPropertyOptional({
    example: 'Platinum Rewards',
    description: 'Custom display name for the card',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  readonly cardName?: string;
}
