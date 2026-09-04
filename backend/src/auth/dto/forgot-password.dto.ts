import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES, SWAGGER_DESCRIPTIONS } from '@/shared';

export class ForgotPasswordDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.EMAIL_REQUIRED,
    example: SWAGGER_DESCRIPTIONS.EMAIL_EXAMPLE,
  })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL_INVALID })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.EMAIL_REQUIRED })
  readonly email: string;
}
