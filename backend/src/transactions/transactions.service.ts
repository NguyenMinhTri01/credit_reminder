import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreditCard,
  Prisma,
  Transaction,
  TransactionSource,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  IPaginatedResponse,
  IPaginationParams,
  ITransaction,
  MAX_PAGE,
  TRANSACTION_MESSAGES,
} from '@/shared';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to map Prisma Transaction entity to ITransaction response.
   */
  private mapTransactionToResponse(t: Transaction): ITransaction {
    return {
      id: t.id,
      cardId: t.cardId,
      type: t.type as 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT',
      amount: t.amount.toFixed(2),
      transactionDate: t.transactionDate.toISOString().slice(0, 10),
      description: t.description,
      merchant: t.merchant,
      idempotencyKey: t.idempotencyKey,
      reconciledAt: t.reconciledAt ? t.reconciledAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    };
  }

  /**
   * Helper to verify that card exists, is not soft-deleted, and belongs to userId.
   */
  private async findOwnedCard(cardId: string, userId: string): Promise<CreditCard> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: cardId, userId, deletedAt: null },
    });

    if (!card) {
      throw new NotFoundException(TRANSACTION_MESSAGES.CARD_NOT_FOUND);
    }

    return card;
  }

  /**
   * Lock and read the card inside a balance transaction. The lock serializes transaction,
   * limit-recalculation, and reconciliation paths so the reconciliation boundary is authoritative.
   */
  private async findOwnedCardForUpdate(
    tx: Prisma.TransactionClient,
    cardId: string,
    userId: string,
  ): Promise<CreditCard> {
    await tx.$queryRaw`
      SELECT "id"
      FROM "credit_cards"
      WHERE "id" = ${cardId}
        AND "user_id" = ${userId}
        AND "deleted_at" IS NULL
      FOR UPDATE
    `;

    const card = await tx.creditCard.findFirst({
      where: { id: cardId, userId, deletedAt: null },
    });

    if (!card) {
      throw new NotFoundException(TRANSACTION_MESSAGES.CARD_NOT_FOUND);
    }

    return card;
  }

  /**
   * Create a manual transaction for a credit card and atomically update availableCredit.
   * EXPENSE decreases available credit, PAYMENT and REFUND increase it.
   * If an idempotencyKey is supplied and a matching record exists, return the existing transaction.
   */
  async create(cardId: string, userId: string, dto: CreateTransactionDto): Promise<ITransaction> {
    await this.findOwnedCard(cardId, userId);

    // Check idempotency first before transaction
    if (dto.idempotencyKey) {
      const existing = await this.prisma.transaction.findUnique({
        where: {
          cardId_idempotencyKey: {
            cardId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });
      if (existing) {
        return this.mapTransactionToResponse(existing);
      }
    }

    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await this.findOwnedCardForUpdate(tx, cardId, userId);

        // Re-check idempotency after acquiring the card lock. This closes the race between
        // the optimistic check above and the insert while keeping retries cheap.
        if (dto.idempotencyKey) {
          const existing = await tx.transaction.findUnique({
            where: {
              cardId_idempotencyKey: {
                cardId,
                idempotencyKey: dto.idempotencyKey,
              },
            },
          });
          if (existing) {
            return this.mapTransactionToResponse(existing);
          }
        }

        const amount = new Prisma.Decimal(dto.amount);
        const effect = dto.type === 'EXPENSE' ? amount.negated() : amount;

        const created = await tx.transaction.create({
          data: {
            cardId,
            type: dto.type as TransactionType,
            amount,
            transactionDate: new Date(`${dto.transactionDate}T00:00:00.000Z`),
            description: dto.description ?? null,
            merchant: dto.merchant ?? null,
            idempotencyKey: dto.idempotencyKey ?? null,
            source: TransactionSource.MANUAL,
          },
        });

        await tx.creditCard.update({
          where: { id: cardId },
          data: {
            availableCredit: { increment: effect },
            currentBalance: { increment: effect.negated() },
          },
        });

        return this.mapTransactionToResponse(created);
      });
    } catch (error) {
      if (
        dto.idempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.transaction.findUnique({
          where: {
            cardId_idempotencyKey: {
              cardId,
              idempotencyKey: dto.idempotencyKey,
            },
          },
        });
        if (existing) {
          return this.mapTransactionToResponse(existing);
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing transaction and adjust availableCredit by the difference.
   * Rejects if transaction was created before card.lastReconciledAt or is an ADJUSTMENT.
   */
  async update(
    cardId: string,
    transactionId: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<ITransaction> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const card = await this.findOwnedCardForUpdate(tx, cardId, userId);
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, cardId },
      });

      if (!transaction) {
        throw new NotFoundException(TRANSACTION_MESSAGES.NOT_FOUND);
      }

      // Check reconciliation boundary and system adjustment immutability using the locked rows.
      if (
        transaction.type === TransactionType.ADJUSTMENT ||
        transaction.reconciledAt !== null ||
        (card.lastReconciledAt && transaction.createdAt < card.lastReconciledAt)
      ) {
        throw new BadRequestException(TRANSACTION_MESSAGES.PRE_RECONCILIATION_EDIT);
      }

      // Calculate old balance effect
      const oldAmount = transaction.amount;
      const oldEffect =
        transaction.type === TransactionType.EXPENSE ? oldAmount.negated() : oldAmount;

      // Determine new balance effect
      const newType = (dto.type as TransactionType) ?? transaction.type;
      const newAmount = dto.amount ? new Prisma.Decimal(dto.amount) : oldAmount;
      const newEffect = newType === TransactionType.EXPENSE ? newAmount.negated() : newAmount;

      // Net difference to apply
      const delta = newEffect.minus(oldEffect);

      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.type !== undefined && { type: dto.type as TransactionType }),
          ...(dto.amount !== undefined && { amount: newAmount }),
          ...(dto.transactionDate !== undefined && {
            transactionDate: new Date(`${dto.transactionDate}T00:00:00.000Z`),
          }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.merchant !== undefined && { merchant: dto.merchant }),
        },
      });

      if (!delta.isZero()) {
        await tx.creditCard.update({
          where: { id: cardId },
          data: {
            availableCredit: { increment: delta },
            currentBalance: { increment: delta.negated() },
          },
        });
      }

      return this.mapTransactionToResponse(updated);
    });
  }

  /**
   * Delete a transaction and reverse its balance effect on availableCredit.
   * Rejects if transaction was created before card.lastReconciledAt or is an ADJUSTMENT.
   */
  async delete(
    cardId: string,
    transactionId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const card = await this.findOwnedCardForUpdate(tx, cardId, userId);
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, cardId },
      });

      if (!transaction) {
        throw new NotFoundException(TRANSACTION_MESSAGES.NOT_FOUND);
      }

      // Check reconciliation boundary and system adjustment immutability using the locked rows.
      if (
        transaction.type === TransactionType.ADJUSTMENT ||
        transaction.reconciledAt !== null ||
        (card.lastReconciledAt && transaction.createdAt < card.lastReconciledAt)
      ) {
        throw new BadRequestException(TRANSACTION_MESSAGES.PRE_RECONCILIATION_DELETE);
      }

      // Old effect: EXPENSE was -amount, PAYMENT/REFUND was +amount.
      // Reversal: negate the old effect.
      const oldAmount = transaction.amount;
      const oldEffect =
        transaction.type === TransactionType.EXPENSE ? oldAmount.negated() : oldAmount;
      const reversal = oldEffect.negated();

      await tx.transaction.delete({
        where: { id: transactionId },
      });

      await tx.creditCard.update({
        where: { id: cardId },
        data: {
          availableCredit: { increment: reversal },
          currentBalance: { increment: reversal.negated() },
        },
      });
    });

    return { message: TRANSACTION_MESSAGES.DELETE_SUCCESS };
  }

  /**
   * Paginated list of transactions for a specific card, ordered by transactionDate DESC, createdAt DESC.
   */
  async findAllByCard(
    cardId: string,
    userId: string,
    pagination?: IPaginationParams,
  ): Promise<IPaginatedResponse<ITransaction>> {
    await this.findOwnedCard(cardId, userId);

    const page = Math.max(1, Math.min(MAX_PAGE, pagination?.page ?? 1));
    const limit = Math.max(1, Math.min(100, pagination?.limit ?? 20));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.transaction.count({ where: { cardId } }),
      this.prisma.transaction.findMany({
        where: { cardId },
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items.map((t) => this.mapTransactionToResponse(t)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
