import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CardType, CreditCard, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CREDIT_CARD_MESSAGES } from '@/shared';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { ReconcileCreditCardDto } from './dto/reconcile-credit-card.dto';

// ─── Test helpers ─────────────────────────────────────────────

const money = (v: string) => new Prisma.Decimal(v);

const NOW = new Date('2026-09-04T05:00:00.000Z');

/**
 * Build a raw Prisma CreditCard row for use in test mocks.
 * Using explicit CreditCard type so overrides allow all nullable field values.
 */
function baseCard(): CreditCard {
  return {
    id: 'card-uuid-1',
    userId: 'user-uuid-1',
    bankCode: 'vietcombank',
    cardType: CardType.VISA,
    bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    cardName: 'Vietcombank',
    lastFourDigits: '1234',
    cardNumberMasked: null,
    creditLimit: money('50000000'),
    availableCredit: money('37500000'),
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

// ─── Mocks ────────────────────────────────────────────────────

function makePrisma() {
  return {
    creditCard: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
}

function makeConfig(timeZone = 'Asia/Ho_Chi_Minh') {
  return {
    get: jest.fn((_key: string, fallback?: string) => timeZone ?? fallback),
  };
}

// ─── Describe block ───────────────────────────────────────────

describe('CreditCardsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let config: ReturnType<typeof makeConfig>;
  let service: CreditCardsService;

  beforeEach(() => {
    prisma = makePrisma();
    config = makeConfig();
    service = new CreditCardsService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
    prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    );
    jest.clearAllMocks();
  });

  // ── getBankCatalog ────────────────────────────────────────────

  describe('getBankCatalog', () => {
    it('returns the full bank catalog array', () => {
      const catalog = service.getBankCatalog();
      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog[0]).toHaveProperty('bankCode');
      expect(catalog[0]).toHaveProperty('shortName');
    });
  });

  describe('getScheduleConfig', () => {
    it('returns the configured application time zone', () => {
      config.get.mockReturnValue('America/New_York');

      expect(service.getScheduleConfig()).toEqual({ timeZone: 'America/New_York' });
    });
  });

  // ── create ────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateCreditCardDto = {
      bankCode: 'vietcombank',
      cardType: CardType.VISA,
      lastFourDigits: '1234',
      creditLimit: '50000000',
      availableCredit: '37500000',
      statementDay: 25,
      paymentDueDaysAfterStatement: 21,
      expiryMonth: 12,
      expiryYear: 2028,
    } as CreateCreditCardDto;

    it('creates and returns the mapped card', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard());

      const result = await service.create('user-uuid-1', dto);

      expect(prisma.creditCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            bankCode: 'vietcombank',
            cardType: CardType.VISA,
            statementDay: 25,
            paymentDueDaysAfterStatement: 21,
            currentBalance: expect.any(Prisma.Decimal),
          }),
        }),
      );
      expect(result.id).toBe('card-uuid-1');
      expect(result.bankCode).toBe('vietcombank');
      expect(result.cardType).toBe(CardType.VISA);
      expect(result.bankShortName).toBe('Vietcombank');
      expect(result.creditLimit).toBe('50000000.00');
      expect(result.availableCredit).toBe('37500000.00');
    });

    it('uses dto.cardName when provided', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard({ cardName: 'My Platinum' }));

      await service.create('user-uuid-1', {
        ...dto,
        cardName: 'My Platinum',
      } as CreateCreditCardDto);

      expect(prisma.creditCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cardName: 'My Platinum' }),
        }),
      );
    });

    it('defaults cardName to bank shortName when not provided', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard());

      await service.create('user-uuid-1', dto);

      expect(prisma.creditCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cardName: 'Vietcombank' }),
        }),
      );
    });

    it('throws BadRequestException for an invalid bankCode', async () => {
      await expect(
        service.create('user-uuid-1', { ...dto, bankCode: 'unknown-bank' } as CreateCreditCardDto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create('user-uuid-1', { ...dto, bankCode: 'unknown-bank' } as CreateCreditCardDto),
      ).rejects.toThrow(CREDIT_CARD_MESSAGES.INVALID_BANK_CODE);

      expect(prisma.creditCard.create).not.toHaveBeenCalled();
    });

    it('computes utilizationPercent correctly', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard());

      const result = await service.create('user-uuid-1', dto);

      // usedAmount = 50000000 - 37500000 = 12500000 → 25%
      expect(result.utilizationPercent).toBe(25);
    });

    it('returns null utilizationPercent when creditLimit is null', async () => {
      prisma.creditCard.create.mockResolvedValue(
        makeCard({ creditLimit: null, availableCredit: null }),
      );

      const result = await service.create('user-uuid-1', dto);

      expect(result.utilizationPercent).toBeNull();
    });

    it('attaches expiryStatus for a valid expiry date', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard({ expiryMonth: 12, expiryYear: 2028 }));

      const result = await service.create('user-uuid-1', dto);

      expect(result.expiryStatus).toBe('valid');
    });

    it('sets expiryStatus to null when expiry fields are missing', async () => {
      prisma.creditCard.create.mockResolvedValue(makeCard({ expiryMonth: null, expiryYear: null }));

      const result = await service.create('user-uuid-1', dto);

      expect(result.expiryStatus).toBeNull();
    });
  });

  // ── findAll ───────────────────────────────────────────────────

  describe('findAll', () => {
    it('queries active and soft-deleted cards for the given userId', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      await service.findAll('user-uuid-1');

      expect(prisma.creditCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('returns mapped cards with computed fields', async () => {
      prisma.creditCard.findMany.mockResolvedValue([makeCard(), makeCard({ id: 'card-uuid-2' })]);

      const results = await service.findAll('user-uuid-1');

      expect(results).toHaveLength(2);
      expect(results[0].bankShortName).toBe('Vietcombank');
      expect(results[0].logoPath).toBe('/images/banks/vietcombank.svg');
      expect(results[0].scheduleInfo).toHaveProperty('nextDueDate');
    });

    it('returns an empty array when the user has no cards', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      const results = await service.findAll('user-uuid-1');

      expect(results).toEqual([]);
    });

    it('does NOT return cards belonging to a different user', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      await service.findAll('user-uuid-2');

      expect(prisma.creditCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid-2' } }),
      );
    });
  });

  // ── findOne ───────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the mapped card for the owner', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());

      const result = await service.findOne('card-uuid-1', 'user-uuid-1');

      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1', userId: 'user-uuid-1', deletedAt: null },
        }),
      );
      expect(result.id).toBe('card-uuid-1');
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.findOne('card-uuid-1', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('card-uuid-1', 'user-uuid-1')).rejects.toThrow(
        CREDIT_CARD_MESSAGES.NOT_FOUND,
      );
    });

    it('throws NotFoundException when card belongs to a different user', async () => {
      // findFirst returns null because the userId filter filters it out
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.findOne('card-uuid-1', 'other-user')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a soft-deleted card', async () => {
      // findFirst returns null because deletedAt: null filter excludes deleted cards
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.findOne('card-uuid-1', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the card and returns the mapped response', async () => {
      const updatedRaw = makeCard({ cardName: 'New Name' });
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(updatedRaw);

      const dto: UpdateCreditCardDto = { cardName: 'New Name' } as UpdateCreditCardDto;
      const result = await service.update('card-uuid-1', 'user-uuid-1', dto);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({ cardName: 'New Name' }),
        }),
      );
      expect(result.cardName).toBe('New Name');
    });

    it('recalculates availableCredit when creditLimit changes (preserves used amount)', async () => {
      // existing: limit=50000000, available=37500000 → used=12500000
      // new limit = 60000000 → new available = 60000000 - 12500000 = 47500000
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(
        makeCard({ creditLimit: money('60000000'), availableCredit: money('47500000') }),
      );

      const dto: UpdateCreditCardDto = { creditLimit: '60000000' } as UpdateCreditCardDto;
      await service.update('card-uuid-1', 'user-uuid-1', dto);

      const updateCall = prisma.creditCard.update.mock.calls[0][0];
      const newAvailable = updateCall.data.availableCredit as Prisma.Decimal;
      expect(newAvailable.toFixed(2)).toBe('47500000.00');
    });

    it('sets availableCredit = new creditLimit when existing limit is null', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(
        makeCard({ creditLimit: null, availableCredit: null }),
      );
      prisma.creditCard.update.mockResolvedValue(
        makeCard({ creditLimit: money('50000000'), availableCredit: money('50000000') }),
      );

      const dto: UpdateCreditCardDto = { creditLimit: '50000000' } as UpdateCreditCardDto;
      await service.update('card-uuid-1', 'user-uuid-1', dto);

      const updateCall = prisma.creditCard.update.mock.calls[0][0];
      const newAvailable = updateCall.data.availableCredit as Prisma.Decimal;
      expect(newAvailable.toFixed(2)).toBe('50000000.00');
    });

    it('validates new bankCode against the catalog', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());

      const dto: UpdateCreditCardDto = { bankCode: 'invalid-bank' } as UpdateCreditCardDto;
      await expect(service.update('card-uuid-1', 'user-uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });

    it('allows updating to a valid bankCode and updates bankName', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(
        makeCard({ bankCode: 'bidv', bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' }),
      );

      const dto: UpdateCreditCardDto = { bankCode: 'bidv' } as UpdateCreditCardDto;
      await service.update('card-uuid-1', 'user-uuid-1', dto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bankCode: 'bidv',
            bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
          }),
        }),
      );
    });

    it('allows updating to a valid card type', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(makeCard({ cardType: CardType.MASTERCARD }));

      await service.update('card-uuid-1', 'user-uuid-1', {
        cardType: CardType.MASTERCARD,
      } as UpdateCreditCardDto);

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cardType: CardType.MASTERCARD }),
        }),
      );
    });

    it('returns legacy cards with a null card type', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard({ cardType: null }));

      const result = await service.findOne('card-uuid-1', 'user-uuid-1');

      expect(result.cardType).toBeNull();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(
        service.update('card-uuid-1', 'user-uuid-1', {} as UpdateCreditCardDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not include fields that were not provided in the update payload', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(makeCard());

      const dto: UpdateCreditCardDto = { statementDay: 15 } as UpdateCreditCardDto;
      await service.update('card-uuid-1', 'user-uuid-1', dto);

      const updateCall = prisma.creditCard.update.mock.calls[0][0];
      // cardName was not provided — should not appear in data
      expect(updateCall.data).not.toHaveProperty('cardName');
    });
  });

  // ── softDelete ────────────────────────────────────────────────

  describe('softDelete', () => {
    it('sets deletedAt on the card and returns a success message', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(makeCard({ deletedAt: new Date() }));

      const result = await service.softDelete('card-uuid-1', 'user-uuid-1');

      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result).toEqual({ message: CREDIT_CARD_MESSAGES.DELETE_SUCCESS });
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('card-uuid-1', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });
  });

  // ── restore ───────────────────────────────────────────────────

  describe('restore', () => {
    it('clears deletedAt and returns the restored card', async () => {
      const deletedCard = makeCard({ deletedAt: new Date('2026-07-01T00:00:00.000Z') });
      const restoredCard = makeCard({ deletedAt: null });
      prisma.creditCard.findFirst.mockResolvedValue(deletedCard);
      prisma.creditCard.update.mockResolvedValue(restoredCard);

      const result = await service.restore('card-uuid-1', 'user-uuid-1');

      // Verify it searches for cards where deletedAt IS NOT NULL
      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'card-uuid-1',
            userId: 'user-uuid-1',
            deletedAt: { not: null },
          }),
        }),
      );
      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: { deletedAt: null },
        }),
      );
      expect(result.deletedAt).toBeNull();
    });

    it('throws NotFoundException when no deleted card is found for that user', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.restore('card-uuid-1', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.creditCard.update).not.toHaveBeenCalled();
    });
  });

  // ── reconcile ─────────────────────────────────────────────────

  describe('reconcile', () => {
    const dto: ReconcileCreditCardDto = {
      availableCredit: '45000000',
    } as ReconcileCreditCardDto;

    beforeEach(() => {
      // $transaction executes the callback with the prisma client as tx
      prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
      );
    });

    it('updates availableCredit and lastReconciledAt within a transaction', async () => {
      const reconciledCard = makeCard({
        availableCredit: money('45000000'),
        lastReconciledAt: NOW,
      });
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(reconciledCard);
      prisma.transaction.create.mockResolvedValue({});

      const result = await service.reconcile('card-uuid-1', 'user-uuid-1', dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.creditCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'card-uuid-1' },
          data: expect.objectContaining({
            availableCredit: expect.any(Prisma.Decimal),
            lastReconciledAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
        where: {
          cardId: 'card-uuid-1',
          createdAt: { lte: expect.any(Date) },
          reconciledAt: null,
        },
        data: { reconciledAt: expect.any(Date) },
      });
      expect(result.availableCredit).toBe('45000000.00');
    });

    it('creates an ADJUSTMENT transaction with a positive delta when credit increases', async () => {
      // existing available = 37500000, new = 45000000 → delta = +7500000
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('45000000') }));
      prisma.transaction.create.mockResolvedValue({});

      await service.reconcile('card-uuid-1', 'user-uuid-1', dto);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cardId: 'card-uuid-1',
            type: TransactionType.ADJUSTMENT,
            amount: expect.any(Prisma.Decimal),
            transactionDate: expect.any(Date),
            reconciledAt: expect.any(Date),
            idempotencyKey: expect.any(String),
          }),
        }),
      );

      const txCall = prisma.transaction.create.mock.calls[0][0];
      expect((txCall.data.amount as Prisma.Decimal).toFixed(2)).toBe('7500000.00');
    });

    it('creates an ADJUSTMENT transaction with a negative delta when credit decreases', async () => {
      // existing available = 37500000, new = 30000000 → delta = -7500000
      prisma.creditCard.findFirst.mockResolvedValue(makeCard());
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('30000000') }));
      prisma.transaction.create.mockResolvedValue({});

      await service.reconcile('card-uuid-1', 'user-uuid-1', {
        availableCredit: '30000000',
      } as ReconcileCreditCardDto);

      const txCall = prisma.transaction.create.mock.calls[0][0];
      expect((txCall.data.amount as Prisma.Decimal).toFixed(2)).toBe('-7500000.00');
    });

    it('treats null existingAvailableCredit as 0 when computing delta', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(makeCard({ availableCredit: null }));
      prisma.creditCard.update.mockResolvedValue(makeCard({ availableCredit: money('10000000') }));
      prisma.transaction.create.mockResolvedValue({});

      await service.reconcile('card-uuid-1', 'user-uuid-1', {
        availableCredit: '10000000',
      } as ReconcileCreditCardDto);

      const txCall = prisma.transaction.create.mock.calls[0][0];
      expect((txCall.data.amount as Prisma.Decimal).toFixed(2)).toBe('10000000.00');
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.reconcile('card-uuid-1', 'user-uuid-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ── mapCardToResponse edge-cases ──────────────────────────────

  describe('mapCardToResponse (via findAll)', () => {
    it('falls back to stored bankName when bankCode is not in catalog', async () => {
      prisma.creditCard.findMany.mockResolvedValue([
        makeCard({ bankCode: 'unknown-code', bankName: 'My Custom Bank' }),
      ]);

      const [card] = await service.findAll('user-uuid-1');

      expect(card.bankName).toBe('My Custom Bank');
      expect(card.bankShortName).toBeNull();
      expect(card.logoPath).toBeNull();
    });

    it('returns null scheduleInfo fields when statementDay is missing', async () => {
      prisma.creditCard.findMany.mockResolvedValue([
        makeCard({ statementDay: null, paymentDueDaysAfterStatement: null }),
      ]);

      const [card] = await service.findAll('user-uuid-1');

      expect(card.scheduleInfo).toEqual({
        statementDate: null,
        nextDueDate: null,
        daysUntilDue: null,
      });
    });

    it('serializes Decimal fields to fixed-2 strings', async () => {
      prisma.creditCard.findMany.mockResolvedValue([makeCard()]);

      const [card] = await service.findAll('user-uuid-1');

      expect(card.creditLimit).toMatch(/^\d+\.\d{2}$/);
      expect(card.availableCredit).toMatch(/^\d+\.\d{2}$/);
    });

    it('serializes Date fields to ISO strings', async () => {
      const reconciledAt = new Date('2026-08-01T12:00:00.000Z');
      prisma.creditCard.findMany.mockResolvedValue([makeCard({ lastReconciledAt: reconciledAt })]);

      const [card] = await service.findAll('user-uuid-1');

      expect(card.lastReconciledAt).toBe(reconciledAt.toISOString());
    });
  });
});
