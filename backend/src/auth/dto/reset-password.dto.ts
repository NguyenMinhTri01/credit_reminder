import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  VALIDATION_MESSAGES,
  SWAGGER_DESCRIPTIONS,
} from '@/shared';

export class ResetPasswordDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.RESET_TOKEN_REQUIRED,
    example: SWAGGER_DESCRIPTIONS.RESET_TOKEN_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.RESET_TOKEN_REQUIRED })
  readonly token: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.NEW_PASSWORD_REQUIRED,
    example: SWAGGER_DESCRIPTIONS.PASSWORD_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.NEW_PASSWORD_REQUIRED })
  @MinLength(PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH })
  @Matches(PASSWORD_REGEX, { message: VALIDATION_MESSAGES.PASSWORD_WEAK })
  readonly newPassword: string;
}
