import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CreditCard,
  Prisma,
  Transaction,
  TransactionSource,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { TRANSACTION_MESSAGES } from '@/shared';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

const money = (v: string) => new Prisma.Decimal(v);

function baseCard(): CreditCard {
  return {
    id: 'card-uuid-1',
    userId: 'user-uuid-1',
    bankCode: 'vietcombank',
    bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    cardName: 'Vietcombank',
    lastFourDigits: '1234',
    cardNumberMasked: null,
    creditLimit: money('60000000'),
    availableCredit: money('60000000'),
    currentBalance: money('0'),
    statementDay: 25,
    paymentDueDaysAfterStatement: 21,
    dueDay: null,
    expiryMonth: 12,
    expiryYear: 2028,
    lastReconciledAt: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    encryptedData: null,
  };
}

function makeCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return { ...baseCard(), ...overrides };
}

function baseTransaction(): Transaction {
  return {
    id: 'tx-uuid-1',
    cardId: 'card-uuid-1',
    amount: money('5000000'),
    transactionDate: new Date('2026-09-05T00:00:00.000Z'),
    description: 'Groceries',
    merchant: 'Vinmart',
    source: TransactionSource.MANUAL,
    rawEmailId: null,
    createdAt: new Date('2026-09-05T10:00:00.000Z'),
    type: TransactionType.EXPENSE,
    reconciledAt: null,
    idempotencyKey: null,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return { ...baseTransaction(), ...overrides };
}

function makePrisma() {
  const p: any = {
    creditCard: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  p.$transaction = jest.fn((callback: (tx: any) => Promise<unknown>) => callback(p));
  return p;
}

describe('TransactionsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TransactionsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TransactionsService(prisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      type: 'EXPENSE',
      amount: '5000000.00',
      transactionDate: '2026-09-05',
      description: 'Groceries',
      merchant: 'Vinmart',
    };

    it('creates an EXPENSE transaction and decreases availableCredit', async () => {
      const card = makeCard({ availableCredit: money('60000000') });
      const createdTx = makeTransaction({
        type: TransactionType.EXPENSE,
        amount: money('5000000'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(createdTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('55000000') }));

      const result = await service.create('card-uuid-1', 'user-uuid-1', createDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cardId: 'card-uuid-1',
            type: TransactionType.EXPENSE,
            amount: expect.any(Prisma.Decimal),
            description: 'Groceries',
            merchant: 'Vinmart',
          }),
        }),
      );
      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: { increment: money('-5000000') },
            currentBalance: { increment: money('5000000') },
          }),
        }),
      );
      expect(result.amount).toBe('5000000.00');
      expect(result.type).toBe('EXPENSE');
    });

    it('creates a PAYMENT transaction and increases availableCredit', async () => {
      const card = makeCard({ availableCredit: money('55000000') });
      const paymentDto: CreateTransactionDto = {
        type: 'PAYMENT',
        amount: '10000000.00',
        transactionDate: '2026-09-05',
      };
      const createdTx = makeTransaction({
        type: TransactionType.PAYMENT,
        amount: money('10000000'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(createdTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('65000000') }));

      const result = await service.create('card-uuid-1', 'user-uuid-1', paymentDto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: { increment: money('10000000') },
            currentBalance: { increment: money('-10000000') },
          }),
        }),
      );
      expect(result.type).toBe('PAYMENT');
    });

    it('creates a REFUND transaction and increases availableCredit', async () => {
      const card = makeCard({ availableCredit: money('62000000') });
      const refundDto: CreateTransactionDto = {
        type: 'REFUND',
        amount: '2000000.00',
        transactionDate: '2026-09-05',
      };
      const createdTx = makeTransaction({
        type: TransactionType.REFUND,
        amount: money('2000000'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(createdTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('64000000') }));

      const result = await service.create('card-uuid-1', 'user-uuid-1', refundDto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: { increment: money('2000000') },
            currentBalance: { increment: money('-2000000') },
          }),
        }),
      );
      expect(result.type).toBe('REFUND');
    });

    it('allows availableCredit to become negative without clamping', async () => {
      const card = makeCard({ availableCredit: money('2000000') });
      const bigExpenseDto: CreateTransactionDto = {
        type: 'EXPENSE',
        amount: '5000000.00',
        transactionDate: '2026-09-05',
      };
      const createdTx = makeTransaction({
        type: TransactionType.EXPENSE,
        amount: money('5000000'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(createdTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('-3000000') }));

      await service.create('card-uuid-1', 'user-uuid-1', bigExpenseDto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableCredit: { increment: money('-5000000') },
            currentBalance: { increment: money('5000000') },
          }),
        }),
      );
    });

    it('allows availableCredit to exceed creditLimit without clamping', async () => {
      const card = makeCard({
        creditLimit: money('60000000'),
        availableCredit: money('55000000'),
      });
      const bigPaymentDto: CreateTransactionDto = {
        type: 'PAYMENT',
        amount: '15000000.00',
        transactionDate: '2026-09-05',
      };

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(makeTransaction());
      prisma.creditCard.update.mockResolvedValue(makeCard());

      await service.create('card-uuid-1', 'user-uuid-1', bigPaymentDto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableCredit: { increment: money('15000000') },
            currentBalance: { increment: money('-15000000') },
          }),
        }),
      );
    });

    it('throws NotFoundException when card does not exist or is soft-deleted', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.create('card-uuid-1', 'user-uuid-1', createDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('returns existing transaction on duplicate idempotencyKey without modifying balance', async () => {
      const card = makeCard();
      const existingTx = makeTransaction({
        id: 'existing-tx-id',
        idempotencyKey: 'idemp-uuid-1',
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findUnique.mockResolvedValue(existingTx);

      const result = await service.create('card-uuid-1', 'user-uuid-1', {
        ...createDto,
        idempotencyKey: 'idemp-uuid-1',
      });

      expect(result.id).toBe('existing-tx-id');
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });

    it('catches P2002 race-condition error and returns existing transaction', async () => {
      const card = makeCard();
      const existingTx = makeTransaction({
        id: 'race-tx-id',
        idempotencyKey: 'idemp-race-1',
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findUnique
        .mockResolvedValueOnce(null) // first check
        .mockResolvedValueOnce(existingTx); // after race

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique error', {
        code: 'P2002',
        clientVersion: '7.7.0',
      });
      prisma.$transaction.mockRejectedValue(p2002Error);

      const result = await service.create('card-uuid-1', 'user-uuid-1', {
        ...createDto,
        idempotencyKey: 'idemp-race-1',
      });

      expect(result.id).toBe('race-tx-id');
    });

    it('re-throws unexpected error during transaction creation', async () => {
      const card = makeCard();
      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.$transaction.mockRejectedValue(new Error('DB Connection Failed'));

      await expect(service.create('card-uuid-1', 'user-uuid-1', createDto)).rejects.toThrow(
        'DB Connection Failed',
      );
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('increases availableCredit by additional amount when expense is increased', async () => {
      // 5M -> 7M: delta = -7M - (-5M) = -2M
      const card = makeCard({ availableCredit: money('55000000') });
      const existingTx = makeTransaction({
        amount: money('5000000'),
        type: TransactionType.EXPENSE,
      });
      const updatedTx = makeTransaction({
        amount: money('7000000'),
        type: TransactionType.EXPENSE,
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(existingTx);
      prisma.transaction.update.mockResolvedValue(updatedTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('53000000') }));

      const result = await service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
        amount: '7000000.00',
      });

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: { increment: money('-2000000') },
            currentBalance: { increment: money('2000000') },
          }),
        }),
      );
      expect(result.amount).toBe('7000000.00');
    });

    it('adjusts balance when changing type from EXPENSE to PAYMENT', async () => {
      // EXPENSE 5M -> PAYMENT 5M: old = -5M, new = +5M, delta = +10M
      const card = makeCard({ availableCredit: money('55000000') });
      const existingTx = makeTransaction({
        amount: money('5000000'),
        type: TransactionType.EXPENSE,
      });
      const updatedTx = makeTransaction({
        amount: money('5000000'),
        type: TransactionType.PAYMENT,
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(existingTx);
      prisma.transaction.update.mockResolvedValue(updatedTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('65000000') }));

      await service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
        type: 'PAYMENT',
      });

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: { increment: money('10000000') },
            currentBalance: { increment: money('-10000000') },
          }),
        }),
      );
    });

    it('does not update credit card balance if delta is zero', async () => {
      const card = makeCard({ availableCredit: money('55000000') });
      const existingTx = makeTransaction({
        amount: money('5000000'),
        type: TransactionType.EXPENSE,
      });
      const updatedTx = makeTransaction({
        description: 'New Description Only',
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(existingTx);
      prisma.transaction.update.mockResolvedValue(updatedTx);

      await service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
        description: 'New Description Only',
      });

      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });

    it('rejects editing transaction predating lastReconciledAt', async () => {
      const card = makeCard({
        lastReconciledAt: new Date('2026-09-04T00:00:00.000Z'),
      });
      const preReconciledTx = makeTransaction({
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(preReconciledTx);

      await expect(
        service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
          amount: '8000000.00',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('rejects editing an ADJUSTMENT transaction', async () => {
      const card = makeCard();
      const adjustmentTx = makeTransaction({
        type: TransactionType.ADJUSTMENT,
        createdAt: new Date('2026-09-06T00:00:00.000Z'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(adjustmentTx);

      await expect(
        service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
          amount: '8000000.00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if transaction is not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update('card-uuid-1', 'unknown-tx', 'user-uuid-1', { amount: '1000' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe('delete', () => {
    it('reverses EXPENSE effect by increasing availableCredit', async () => {
      const card = makeCard({ availableCredit: money('55000000') });
      const expenseTx = makeTransaction({
        amount: money('5000000'),
        type: TransactionType.EXPENSE,
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(expenseTx);
      prisma.transaction.delete.mockResolvedValue(expenseTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('60000000') }));

      const result = await service.delete('card-uuid-1', 'tx-uuid-1', 'user-uuid-1');

      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'tx-uuid-1' },
      });
      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableCredit: { increment: money('5000000') },
            currentBalance: { increment: money('-5000000') },
          }),
        }),
      );
      expect(result).toEqual({ message: TRANSACTION_MESSAGES.DELETE_SUCCESS });
    });

    it('reverses PAYMENT effect by decreasing availableCredit', async () => {
      const card = makeCard({ availableCredit: money('65000000') });
      const paymentTx = makeTransaction({
        amount: money('10000000'),
        type: TransactionType.PAYMENT,
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(paymentTx);
      prisma.transaction.delete.mockResolvedValue(paymentTx);
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('55000000') }));

      await service.delete('card-uuid-1', 'tx-uuid-1', 'user-uuid-1');

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableCredit: { increment: money('-10000000') },
            currentBalance: { increment: money('10000000') },
          }),
        }),
      );
    });

    it('rejects deleting transaction predating lastReconciledAt', async () => {
      const card = makeCard({
        lastReconciledAt: new Date('2026-09-04T00:00:00.000Z'),
      });
      const preReconciledTx = makeTransaction({
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(preReconciledTx);

      await expect(service.delete('card-uuid-1', 'tx-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.transaction.delete).not.toHaveBeenCalled();
    });

    it('rejects deleting an ADJUSTMENT transaction', async () => {
      const card = makeCard();
      const adjustmentTx = makeTransaction({
        type: TransactionType.ADJUSTMENT,
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(adjustmentTx);

      await expect(service.delete('card-uuid-1', 'tx-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if transaction to delete is not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.delete('card-uuid-1', 'unknown-tx', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findAllByCard ────────────────────────────────────────────

  describe('findAllByCard', () => {
    it('returns paginated transactions ordered by date descending', async () => {
      const card = makeCard();
      const txList = [
        makeTransaction({ id: 'tx-1', amount: money('2000000') }),
        makeTransaction({ id: 'tx-2', amount: money('3000000') }),
      ];

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.count.mockResolvedValue(2);
      prisma.transaction.findMany.mockResolvedValue(txList);

      const result = await service.findAllByCard('card-uuid-1', 'user-uuid-1', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cardId: 'card-uuid-1' },
          orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
          skip: 0,
          take: 10,
        }),
      );
    });

    it('handles custom page and limit with totalPages computation', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.transaction.count.mockResolvedValue(25);
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAllByCard('card-uuid-1', 'user-uuid-1', {
        page: 3,
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('handles zero total items gracefully with totalPages = 1', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.transaction.count.mockResolvedValue(0);
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAllByCard('card-uuid-1', 'user-uuid-1');

      expect(result.meta.totalPages).toBe(1);
      expect(result.items).toEqual([]);
    });

    it('clamps invalid or out-of-range pagination parameters', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.transaction.count.mockResolvedValue(10);
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAllByCard('card-uuid-1', 'user-uuid-1', {
        page: -5,
        limit: 200,
      });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(100);
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.findAllByCard('unknown-card', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('edge branch coverage', () => {
    it('creates a transaction with no optional fields and handles null card availableCredit', async () => {
      const card = makeCard({ availableCredit: null });
      const createdTx = makeTransaction({
        description: null,
        merchant: null,
        idempotencyKey: null,
        reconciledAt: new Date('2026-09-05T12:00:00.000Z'),
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.create.mockResolvedValue(createdTx);
      prisma.creditCard.update.mockResolvedValue(card);

      const result = await service.create('card-uuid-1', 'user-uuid-1', {
        type: 'PAYMENT',
        amount: '1000',
        transactionDate: '2026-09-05',
      });

      expect(result.reconciledAt).toBe('2026-09-05T12:00:00.000Z');
      expect(result.description).toBeNull();
      expect(result.merchant).toBeNull();
    });

    it('updates transaction date, merchant, and handles null card availableCredit', async () => {
      const card = makeCard({ availableCredit: null });
      const existingTx = makeTransaction();
      const updatedTx = makeTransaction({
        transactionDate: new Date('2026-09-08T00:00:00.000Z'),
        merchant: 'New Merchant',
      });

      prisma.creditCard.findFirst.mockResolvedValue(card);
      prisma.transaction.findFirst.mockResolvedValue(existingTx);
      prisma.transaction.update.mockResolvedValue(updatedTx);
      prisma.creditCard.update.mockResolvedValue(card);

      const result = await service.update('card-uuid-1', 'tx-uuid-1', 'user-uuid-1', {
        transactionDate: '2026-09-08',
        merchant: 'New Merchant',
      });

      expect(result.merchant).toBe('New Merchant');
    });
  });
});
