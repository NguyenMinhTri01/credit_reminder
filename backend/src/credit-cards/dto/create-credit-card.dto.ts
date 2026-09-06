import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { CREDIT_CARD_MESSAGES } from '@/shared';

// ─── Custom validator ─────────────────────────────────────────

/**
 * Validates that a string value, when parsed as a float, is strictly positive (> 0).
 */
function IsPositiveDecimalString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPositiveDecimalString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        },
      },
    });
  };
}

const CURRENT_YEAR = new Date().getFullYear();

// ─── DTO ─────────────────────────────────────────────────────

export class CreateCreditCardDto {
  @ApiProperty({
    example: 'vietcombank',
    description: 'Bank code from the supported catalog',
  })
  @IsString({ message: CREDIT_CARD_MESSAGES.BANK_CODE_REQUIRED })
  @IsNotEmpty({ message: CREDIT_CARD_MESSAGES.BANK_CODE_REQUIRED })
  readonly bankCode: string;

  @ApiProperty({
    example: '1234',
    description: 'Last 4 digits of the card',
  })
  @Matches(/^\d{4}$/, { message: CREDIT_CARD_MESSAGES.LAST_FOUR_DIGITS_FORMAT })
  readonly lastFourDigits: string;

  @ApiProperty({
    example: '50000000.00',
    description: 'Credit limit as decimal string (VND)',
  })
  @IsNotEmpty({ message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_REQUIRED })
  @Matches(/^\d+(\.\d+)?$/, { message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_FORMAT })
  @IsPositiveDecimalString({ message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_POSITIVE })
  readonly creditLimit: string;

  @ApiProperty({
    example: '50000000.00',
    description: 'Available credit as decimal string (VND)',
  })
  @Matches(/^\d+(\.\d+)?$/, { message: CREDIT_CARD_MESSAGES.AVAILABLE_CREDIT_FORMAT })
  readonly availableCredit: string;

  @ApiProperty({
    example: 25,
    description: 'Statement closing day of month (1–31)',
  })
  @IsInt({ message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_REQUIRED })
  @Min(1, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  @Max(31, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  readonly statementDay: number;

  @ApiProperty({
    example: 21,
    description: 'Number of grace-period days after statement close',
  })
  @IsInt({ message: CREDIT_CARD_MESSAGES.PAYMENT_DUE_DAYS_POSITIVE })
  @Min(1, { message: CREDIT_CARD_MESSAGES.PAYMENT_DUE_DAYS_POSITIVE })
  readonly paymentDueDaysAfterStatement: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Expiry month (1–12)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.EXPIRY_MONTH_RANGE })
  @Max(12, { message: CREDIT_CARD_MESSAGES.EXPIRY_MONTH_RANGE })
  readonly expiryMonth?: number;

  @ApiPropertyOptional({
    example: 2028,
    description: 'Expiry year (current year or later)',
  })
  @IsOptional()
  @IsInt()
  @Min(CURRENT_YEAR, { message: CREDIT_CARD_MESSAGES.EXPIRY_YEAR_MIN })
  readonly expiryYear?: number;

  @ApiPropertyOptional({
    example: 'Platinum Rewards',
    description: 'Custom display name for the card',
  })
  @IsOptional()
  @IsString()
  readonly cardName?: string;
}
