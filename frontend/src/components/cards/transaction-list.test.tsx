import { render, screen } from '@testing-library/react'

import { TransactionList } from './transaction-list'
import type { ICreditCard, ITransaction } from '@/shared'

const downwardAdjustment: ITransaction = {
  id: 'transaction-1',
  cardId: 'card-1',
  type: 'ADJUSTMENT',
  amount: '-7500000.00',
  transactionDate: '2026-09-06',
  description: null,
  merchant: null,
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  reconciledAt: null,
  createdAt: '2026-09-06T00:00:00.000Z',
}

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}))

jest.mock('@/hooks/use-transactions', () => ({
  useTransactionList: () => ({
    data: {
      items: [downwardAdjustment],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }),
  useDeleteTransaction: () => ({ isPending: false, mutateAsync: jest.fn() }),
}))

const card = {
  id: 'card-1',
  lastReconciledAt: '2026-09-06T00:00:00.000Z',
} as ICreditCard

describe('TransactionList', () => {
  it('shows a minus sign for a downward reconciliation adjustment', () => {
    render(<TransactionList card={card} />)

    expect(screen.getByText('-₫7,500,000')).toBeInTheDocument()
  })
})
