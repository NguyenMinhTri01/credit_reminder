import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { CREDIT_CARD_MESSAGES, IsDecimal15_2String } from '@/shared';

export class ReconcileCreditCardDto {
  @ApiProperty({
    example: '45000000.00',
    description: 'New available credit balance as decimal string (VND)',
  })
  @IsNotEmpty({ message: CREDIT_CARD_MESSAGES.AVAILABLE_CREDIT_RECONCILE_REQUIRED })
  @IsDecimal15_2String({ message: CREDIT_CARD_MESSAGES.AVAILABLE_CREDIT_FORMAT })
  readonly availableCredit: string;
}
