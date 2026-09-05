import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MESSAGES } from '@/shared';

export class RefreshTokenDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.REFRESH_TOKEN_REQUIRED,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REFRESH_TOKEN_REQUIRED })
  readonly refreshToken: string;
}
