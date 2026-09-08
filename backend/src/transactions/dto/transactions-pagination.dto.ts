import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_LIMIT, TRANSACTION_MESSAGES } from '@/shared';

export class TransactionsPaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: TRANSACTION_MESSAGES.PAGE_INVALID })
  @Min(1, { message: TRANSACTION_MESSAGES.PAGE_INVALID })
  readonly page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: TRANSACTION_MESSAGES.LIMIT_INVALID })
  @Min(1, { message: TRANSACTION_MESSAGES.LIMIT_INVALID })
  @Max(MAX_LIMIT, { message: TRANSACTION_MESSAGES.LIMIT_INVALID })
  readonly limit?: number;
}
