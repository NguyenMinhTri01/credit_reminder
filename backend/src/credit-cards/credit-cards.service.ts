import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditCard, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BANK_CATALOG,
  CREDIT_CARD_MESSAGES,
  ICreditCard,
  IScheduleInfo,
  IBankCatalogEntry,
  findBankByCode,
  calculateNextPaymentDue,
  getExpiryStatus,
  DEFAULT_APP_TIME_ZONE,
} from '@/shared';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { ReconcileCreditCardDto } from './dto/reconcile-credit-card.dto';

// ─── Internal helpers ─────────────────────────────────────────

/**
 * Compute utilization percent from availableCredit and creditLimit Decimal fields.
 * Returns null when limit is unknown or zero.
 */
function calculateUtilization(
  availableCredit: Prisma.Decimal | null | undefined,
  creditLimit: Prisma.Decimal | null | undefined,
): number | null {
  if (!creditLimit || !availableCredit || creditLimit.isZero()) return null;
  const used = creditLimit.minus(availableCredit);
  return parseFloat(used.dividedBy(creditLimit).times(100).toFixed(2));
}

// ─── Service ─────────────────────────────────────────────────

@Injectable()
export class CreditCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Map a raw Prisma CreditCard row to the ICreditCard response shape,
   * enriching it with bank catalog info, expiry status, and schedule info.
   */
  private mapCardToResponse(card: CreditCard, now: Date, timeZone: string): ICreditCard {
    const bankInfo: IBankCatalogEntry | undefined = findBankByCode(card.bankCode ?? '');

    const expiryInfo = getExpiryStatus(card.expiryMonth, card.expiryYear, now, timeZone);

    const scheduleRaw = calculateNextPaymentDue(
      card.statementDay,
      card.paymentDueDaysAfterStatement,
      card.dueDay,
      now,
      timeZone,
    );

    const scheduleInfo: IScheduleInfo = scheduleRaw
      ? {
          statementDate: scheduleRaw.statementDate,
          nextDueDate: scheduleRaw.nextDueDate,
          daysUntilDue: scheduleRaw.daysUntilDue,
        }
      : { statementDate: null, nextDueDate: null, daysUntilDue: null };

    const utilizationPercent = calculateUtilization(card.availableCredit, card.creditLimit);

    return {
      id: card.id,
      userId: card.userId,
      bankCode: card.bankCode,
      bankName: bankInfo?.name ?? card.bankName,
      bankShortName: bankInfo?.shortName ?? null,
      logoPath: bankInfo?.logoPath ?? null,
      cardName: card.cardName,
      lastFourDigits: card.lastFourDigits,
      cardNumberMasked: card.cardNumberMasked,
      creditLimit: card.creditLimit?.toFixed(2) ?? null,
      availableCredit: card.availableCredit?.toFixed(2) ?? null,
      utilizationPercent,
      statementDay: card.statementDay,
      paymentDueDaysAfterStatement: card.paymentDueDaysAfterStatement,
      dueDay: card.dueDay,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      expiryStatus: expiryInfo?.status ?? null,
      scheduleInfo,
      lastReconciledAt: card.lastReconciledAt?.toISOString() ?? null,
      deletedAt: card.deletedAt?.toISOString() ?? null,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  /**
   * Fetch a non-deleted card owned by userId, throwing NotFoundException if absent.
   */
  private async findOneRaw(id: string, userId: string): Promise<CreditCard> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!card) {
      throw new NotFoundException(CREDIT_CARD_MESSAGES.NOT_FOUND);
    }

    return card;
  }

  /**
   * Resolve the current app timezone from config (or default).
   */
  private getTimeZone(): string {
    return this.configService.get<string>('APP_TIME_ZONE', DEFAULT_APP_TIME_ZONE);
  }

  // ── Public methods ───────────────────────────────────────────

  /**
   * Return the full bank catalog (no auth needed — public data).
   */
  getBankCatalog(): ReadonlyArray<IBankCatalogEntry> {
    return BANK_CATALOG;
  }

  /**
   * Create a new credit card for the authenticated user.
   * bankCode is validated against the catalog; userId is taken from the JWT session.
   */
  async create(userId: string, dto: CreateCreditCardDto): Promise<ICreditCard> {
    const bankEntry = findBankByCode(dto.bankCode);
    if (!bankEntry) {
      throw new BadRequestException(CREDIT_CARD_MESSAGES.INVALID_BANK_CODE);
    }

    const card = await this.prisma.creditCard.create({
      data: {
        userId,
        bankCode: dto.bankCode,
        bankName: bankEntry.name,
        cardName: dto.cardName ?? bankEntry.shortName,
        lastFourDigits: dto.lastFourDigits,
        creditLimit: new Prisma.Decimal(dto.creditLimit),
        availableCredit: new Prisma.Decimal(dto.availableCredit),
        statementDay: dto.statementDay,
        paymentDueDaysAfterStatement: dto.paymentDueDaysAfterStatement,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
      },
    });

    return this.mapCardToResponse(card, new Date(), this.getTimeZone());
  }

  /**
   * Return all non-deleted cards for the authenticated user, ordered by creation date.
   */
  async findAll(userId: string): Promise<ICreditCard[]> {
    const cards = await this.prisma.creditCard.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const timeZone = this.getTimeZone();

    return cards.map((card) => this.mapCardToResponse(card, now, timeZone));
  }

  /**
   * Return a single card owned by userId, throwing NotFoundException if absent.
   */
  async findOne(id: string, userId: string): Promise<ICreditCard> {
    const card = await this.findOneRaw(id, userId);
    return this.mapCardToResponse(card, new Date(), this.getTimeZone());
  }

  /**
   * Update allowed fields on an existing card.
   *
   * If creditLimit changes, available credit is recalculated to preserve the used amount:
   *   newAvailableCredit = newLimit − (oldLimit − oldAvailableCredit)
   */
  async update(id: string, userId: string, dto: UpdateCreditCardDto): Promise<ICreditCard> {
    const existing = await this.findOneRaw(id, userId);

    // Validate bankCode if being changed
    if (dto.bankCode !== undefined) {
      const bankEntry = findBankByCode(dto.bankCode);
      if (!bankEntry) {
        throw new BadRequestException(CREDIT_CARD_MESSAGES.INVALID_BANK_CODE);
      }
    }

    // When creditLimit changes, preserve the used amount to derive new availableCredit
    let newAvailableCredit: Prisma.Decimal | undefined;

    if (dto.creditLimit !== undefined) {
      const newLimit = new Prisma.Decimal(dto.creditLimit);

      if (existing.creditLimit !== null && existing.availableCredit !== null) {
        const usedAmount = existing.creditLimit.minus(existing.availableCredit);
        newAvailableCredit = newLimit.minus(usedAmount);
      } else {
        // No prior limit/available data — set available = new limit
        newAvailableCredit = newLimit;
      }
    }

    const bankEntry = dto.bankCode ? findBankByCode(dto.bankCode) : undefined;

    const updatedCard = await this.prisma.creditCard.update({
      where: { id },
      data: {
        ...(dto.bankCode !== undefined && {
          bankCode: dto.bankCode,
          bankName: bankEntry?.name ?? existing.bankName,
        }),
        ...(dto.cardName !== undefined && { cardName: dto.cardName }),
        ...(dto.lastFourDigits !== undefined && { lastFourDigits: dto.lastFourDigits }),
        ...(dto.creditLimit !== undefined && { creditLimit: new Prisma.Decimal(dto.creditLimit) }),
        ...(newAvailableCredit !== undefined && { availableCredit: newAvailableCredit }),
        ...(dto.statementDay !== undefined && { statementDay: dto.statementDay }),
        ...(dto.paymentDueDaysAfterStatement !== undefined && {
          paymentDueDaysAfterStatement: dto.paymentDueDaysAfterStatement,
        }),
        ...(dto.expiryMonth !== undefined && { expiryMonth: dto.expiryMonth }),
        ...(dto.expiryYear !== undefined && { expiryYear: dto.expiryYear }),
      },
    });

    return this.mapCardToResponse(updatedCard, new Date(), this.getTimeZone());
  }

  /**
   * Soft-delete a card by setting deletedAt = now.
   * Returns 200 JSON (not 204) so the client can safely call response.json().
   */
  async softDelete(id: string, userId: string): Promise<{ message: string }> {
    await this.findOneRaw(id, userId);

    await this.prisma.creditCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: CREDIT_CARD_MESSAGES.DELETE_SUCCESS };
  }

  /**
   * Restore a previously soft-deleted card by clearing deletedAt.
   */
  async restore(id: string, userId: string): Promise<ICreditCard> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });

    if (!card) {
      throw new NotFoundException(CREDIT_CARD_MESSAGES.NOT_FOUND);
    }

    const restoredCard = await this.prisma.creditCard.update({
      where: { id },
      data: { deletedAt: null },
    });

    return this.mapCardToResponse(restoredCard, new Date(), this.getTimeZone());
  }

  /**
   * Manually reconcile the available credit of a card.
   *
   * Within a single transaction:
   *   1. Updates availableCredit and lastReconciledAt on the card.
   *   2. Creates an ADJUSTMENT transaction with the signed delta for auditability.
   */
  async reconcile(id: string, userId: string, dto: ReconcileCreditCardDto): Promise<ICreditCard> {
    const existing = await this.findOneRaw(id, userId);

    const newAvailableCredit = new Prisma.Decimal(dto.availableCredit);
    const currentAvailableCredit = existing.availableCredit ?? new Prisma.Decimal(0);
    const delta = newAvailableCredit.minus(currentAvailableCredit);

    const reconciledAt = new Date();

    const updatedCard = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const card = await tx.creditCard.update({
        where: { id },
        data: {
          availableCredit: newAvailableCredit,
          lastReconciledAt: reconciledAt,
        },
      });

      await tx.transaction.create({
        data: {
          cardId: id,
          type: TransactionType.ADJUSTMENT,
          amount: delta,
          transactionDate: reconciledAt,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      return card;
    });

    return this.mapCardToResponse(updatedCard, new Date(), this.getTimeZone());
  }
}
