import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import { CREDIT_CARD_MESSAGES } from '@/shared';

export class ReconcileCreditCardDto {
  @ApiProperty({
    example: '45000000.00',
    description: 'New available credit balance as decimal string (VND)',
  })
  @IsNotEmpty({ message: CREDIT_CARD_MESSAGES.AVAILABLE_CREDIT_RECONCILE_REQUIRED })
  @Matches(/^\d+(\.\d+)?$/, { message: CREDIT_CARD_MESSAGES.AVAILABLE_CREDIT_FORMAT })
  readonly availableCredit: string;
}
