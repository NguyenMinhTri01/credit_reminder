import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MESSAGES, SWAGGER_DESCRIPTIONS } from '@/shared';

export class GoogleAuthDto {
  @ApiProperty({ description: VALIDATION_MESSAGES.GOOGLE_TOKEN_REQUIRED, example: SWAGGER_DESCRIPTIONS.GOOGLE_TOKEN_EXAMPLE })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.GOOGLE_TOKEN_REQUIRED })
  readonly idToken: string;
}
