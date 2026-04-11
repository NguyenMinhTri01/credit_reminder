import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, MinLength, MaxLength, Min } from 'class-validator';
import { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@credit-reminder/shared';

export class CreateReminderDto {
  @ApiProperty({ description: 'Reminder title', example: 'Monthly credit payment' })
  @IsString()
  @IsNotEmpty()
  @MinLength(TITLE_MIN_LENGTH)
  @MaxLength(TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({ description: 'Reminder description', example: 'Pay credit card bill' })
  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({ description: 'Amount', example: 1000000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Due date in ISO format', example: '2025-12-31T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  dueDate: string;
}
