import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { TRANSACTION_MESSAGES } from '@/shared';

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

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    example: 'PAYMENT',
    enum: ['EXPENSE', 'PAYMENT', 'REFUND'],
    description: 'Transaction type',
  })
  @IsOptional()
  @IsEnum(['EXPENSE', 'PAYMENT', 'REFUND'], { message: TRANSACTION_MESSAGES.TYPE_INVALID })
  readonly type?: 'EXPENSE' | 'PAYMENT' | 'REFUND';

  @ApiPropertyOptional({
    example: '7000000.00',
    description: 'Transaction amount as decimal string (VND)',
  })
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/, { message: TRANSACTION_MESSAGES.AMOUNT_FORMAT })
  @IsPositiveDecimalString({ message: TRANSACTION_MESSAGES.AMOUNT_POSITIVE })
  readonly amount?: string;

  @ApiPropertyOptional({
    example: '2026-09-06',
    description: 'Transaction date in YYYY-MM-DD format',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: TRANSACTION_MESSAGES.DATE_FORMAT })
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
