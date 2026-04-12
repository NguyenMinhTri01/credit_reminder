import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, MinLength, MaxLength, Min, IsEnum, IsBoolean } from 'class-validator';
import { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH } from '@/shared';
import { ReminderFrequency } from '@prisma/client';

export class CreateReminderDto {
  @ApiProperty({ description: 'Reminder title', example: 'Monthly credit payment' })
  @IsString()
  @IsNotEmpty()
  @MinLength(TITLE_MIN_LENGTH)
  @MaxLength(TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({ description: 'Amount', example: 1000000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Frequency', enum: ReminderFrequency, example: 'MONTHLY' })
  @IsEnum(ReminderFrequency)
  @IsOptional()
  frequency?: ReminderFrequency;

  @ApiProperty({ description: 'Next trigger date in ISO format', example: '2025-12-31T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  nextTriggerDate: string;

  @ApiPropertyOptional({ description: 'Zalo message template', example: 'Nhắc nhở thanh toán' })
  @IsString()
  @IsOptional()
  zaloMessageTemplate?: string;
}
