import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
  SWAGGER_DESCRIPTIONS,
} from '@/shared';

export class RegisterDto {
  @ApiProperty({ description: VALIDATION_MESSAGES.EMAIL_REQUIRED, example: SWAGGER_DESCRIPTIONS.EMAIL_EXAMPLE })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.EMAIL_REQUIRED })
  readonly email: string;

  @ApiProperty({ description: VALIDATION_MESSAGES.PASSWORD_REQUIRED, example: SWAGGER_DESCRIPTIONS.PASSWORD_EXAMPLE })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
  @MinLength(PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  @Matches(PASSWORD_REGEX, { message: VALIDATION_MESSAGES.PASSWORD_WEAK })
  readonly password: string;

  @ApiProperty({ description: VALIDATION_MESSAGES.FULL_NAME_REQUIRED, example: SWAGGER_DESCRIPTIONS.FULL_NAME_EXAMPLE })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FULL_NAME_REQUIRED })
  @MinLength(NAME_MIN_LENGTH, { message: VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH })
  @MaxLength(NAME_MAX_LENGTH, { message: VALIDATION_MESSAGES.FULL_NAME_MAX_LENGTH })
  readonly fullName: string;
}
