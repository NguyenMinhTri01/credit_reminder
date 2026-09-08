import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTransactionDto } from './create-transaction.dto';
import { UpdateTransactionDto } from './update-transaction.dto';
import { TransactionsPaginationDto } from './transactions-pagination.dto';

describe('Transaction DTOs', () => {
  describe('CreateTransactionDto', () => {
    it('validates a valid EXPENSE transaction DTO', async () => {
      const dto = plainToInstance(CreateTransactionDto, {
        type: 'EXPENSE',
        amount: '500000.00',
        transactionDate: '2026-09-05',
        description: 'Supermarket',
        merchant: 'Vinmart',
        idempotencyKey: 'c80c2f82-a0e2-45e0-b638-34857b6f6f9c',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects invalid transaction type, negative amount, and bad date format', async () => {
      const dto = plainToInstance(CreateTransactionDto, {
        type: 'INVALID_TYPE' as any,
        amount: '-500',
        transactionDate: '05/09/2026',
        idempotencyKey: 'not-a-uuid',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });

    it('rejects non-numeric string or non-string amount', async () => {
      const dto = plainToInstance(CreateTransactionDto, {
        type: 'PAYMENT',
        amount: 'abc',
        transactionDate: '2026-09-05',
      });
      const errors = await validate(dto);
      const amountErr = errors.find((e) => e.property === 'amount');
      expect(amountErr).toBeDefined();

      const nonStringDto = plainToInstance(CreateTransactionDto, {
        type: 'PAYMENT',
        amount: 50000 as any,
        transactionDate: '2026-09-05',
      });
      const nonStringErrors = await validate(nonStringDto);
      expect(nonStringErrors.find((e) => e.property === 'amount')).toBeDefined();
    });

    it('rejects calendar-invalid dates and values outside DECIMAL(15,2)', async () => {
      const dto = plainToInstance(CreateTransactionDto, {
        type: 'EXPENSE',
        amount: '10000000000000.001',
        transactionDate: '2026-02-30',
      });

      const errors = await validate(dto);
      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['amount', 'transactionDate']),
      );
    });
  });

  describe('UpdateTransactionDto', () => {
    it('validates a valid partial update DTO', async () => {
      const dto = plainToInstance(UpdateTransactionDto, {
        type: 'PAYMENT',
        amount: '1000000.00',
        transactionDate: '2026-09-06',
        description: 'Updated',
        merchant: 'Store',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects negative or non-string amount in update', async () => {
      const dto = plainToInstance(UpdateTransactionDto, {
        amount: '-100',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);

      const nonStringDto = plainToInstance(UpdateTransactionDto, {
        amount: 1000 as any,
      });
      const nonStringErrors = await validate(nonStringDto);
      expect(nonStringErrors).toHaveLength(1);
    });

    it('rejects null non-nullable fields and unsupported money precision in update', async () => {
      const dto = plainToInstance(UpdateTransactionDto, {
        type: null,
        transactionDate: null,
        amount: '0.001',
      });

      const errors = await validate(dto);
      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['type', 'transactionDate', 'amount']),
      );
    });
  });

  describe('TransactionsPaginationDto', () => {
    it('transforms valid numeric query strings into numbers', async () => {
      const dto = plainToInstance(TransactionsPaginationDto, { page: '2', limit: '20' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(20);
    });

    it('rejects partially numeric query strings and out-of-range limits', async () => {
      const dto = plainToInstance(TransactionsPaginationDto, { page: '2abc', limit: '101' });

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });
});
