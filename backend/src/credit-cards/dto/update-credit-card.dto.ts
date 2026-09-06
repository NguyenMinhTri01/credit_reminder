import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
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

export class UpdateCreditCardDto {
  @ApiPropertyOptional({
    example: 'vietcombank',
    description: 'Bank code from the supported catalog',
  })
  @IsOptional()
  @IsString({ message: CREDIT_CARD_MESSAGES.BANK_CODE_REQUIRED })
  readonly bankCode?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'Last 4 digits of the card',
  })
  @IsOptional()
  @Matches(/^\d{4}$/, { message: CREDIT_CARD_MESSAGES.LAST_FOUR_DIGITS_FORMAT })
  readonly lastFourDigits?: string;

  @ApiPropertyOptional({
    example: '60000000.00',
    description: 'New credit limit as decimal string (VND)',
  })
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_FORMAT })
  @IsPositiveDecimalString({ message: CREDIT_CARD_MESSAGES.CREDIT_LIMIT_POSITIVE })
  readonly creditLimit?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Statement closing day of month (1–31)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  @Max(31, { message: CREDIT_CARD_MESSAGES.STATEMENT_DAY_RANGE })
  readonly statementDay?: number;

  @ApiPropertyOptional({
    example: 21,
    description: 'Number of grace-period days after statement close',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: CREDIT_CARD_MESSAGES.PAYMENT_DUE_DAYS_POSITIVE })
  readonly paymentDueDaysAfterStatement?: number;

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
