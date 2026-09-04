import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MESSAGES, SWAGGER_DESCRIPTIONS } from '@/shared';

export class LoginDto {
  @ApiProperty({ description: VALIDATION_MESSAGES.EMAIL_REQUIRED, example: SWAGGER_DESCRIPTIONS.EMAIL_EXAMPLE })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.EMAIL_REQUIRED })
  readonly email: string;

  @ApiProperty({ description: VALIDATION_MESSAGES.PASSWORD_REQUIRED, example: SWAGGER_DESCRIPTIONS.PASSWORD_EXAMPLE })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.PASSWORD_REQUIRED })
  readonly password: string;
}
