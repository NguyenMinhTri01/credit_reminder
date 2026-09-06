import { ApiProperty } from '@nestjs/swagger';
import { ITransaction } from '@/shared';

export class TransactionResponseDto implements ITransaction {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  cardId!: string;

  @ApiProperty({ enum: ['EXPENSE', 'PAYMENT', 'REFUND', 'ADJUSTMENT'] })
  type!: 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';

  @ApiProperty({ example: '5000000.00', description: 'Amount as decimal string (VND)' })
  amount!: string;

  @ApiProperty({ example: '2026-09-05', format: 'date' })
  transactionDate!: string;

  @ApiProperty({ example: 'Grocery shopping', nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ example: 'Vinmart', nullable: true, type: String })
  merchant!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  idempotencyKey!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  reconciledAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class DeleteTransactionResponseDto {
  @ApiProperty({ example: 'Transaction deleted successfully' })
  message!: string;
}
