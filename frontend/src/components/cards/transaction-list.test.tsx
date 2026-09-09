import { fireEvent, render, screen, waitFor } from '@testing-library/react'

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

const mockUseTransactionList = jest.fn((cardId?: string, page?: number) => {
  void cardId
  void page
  return {
    data: {
      items: [downwardAdjustment],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    isLoading: false,
  }
})
const mockDeleteMutateAsync = jest.fn()

jest.mock('@/hooks/use-transactions', () => ({
  useTransactionList: (cardId: string, page: number) => mockUseTransactionList(cardId, page),
  useDeleteTransaction: () => ({ isPending: false, mutateAsync: mockDeleteMutateAsync }),
}))

const card = {
  id: 'card-1',
  lastReconciledAt: '2026-09-06T00:00:00.000Z',
} as ICreditCard

describe('TransactionList', () => {
  beforeEach(() => {
    mockUseTransactionList.mockImplementation(() => ({
      data: {
        items: [downwardAdjustment],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
    }))
  })

  it('shows a minus sign for a downward reconciliation adjustment', () => {
    render(<TransactionList card={card} />)

    expect(screen.getByText('-₫7,500,000')).toBeInTheDocument()
  })

  it('refetches the last valid page instead of rendering a false empty state', async () => {
    mockUseTransactionList.mockImplementation((cardId = '', page = 1) => {
      void cardId
      return page === 1
        ? {
            data: { items: [downwardAdjustment], meta: { page: 1, limit: 20, total: 41, totalPages: 3 } },
            isLoading: false,
          }
        : page === 2
          ? {
              data: { items: [], meta: { page: 2, limit: 20, total: 1, totalPages: 1 } },
              isLoading: false,
            }
          : {
              data: {
                items: [downwardAdjustment],
                meta: { page, limit: 20, total: 1, totalPages: 1 },
              },
              isLoading: false,
            }
    })

    render(<TransactionList card={card} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(screen.queryByText('transactions.noTransactions')).not.toBeInTheDocument()
    })
  })

  it('keeps the confirmation open until deletion succeeds', async () => {
    const deletableTransaction: ITransaction = {
      ...downwardAdjustment,
      type: 'EXPENSE',
      amount: '1000.00',
    }
    let resolveDelete: (() => void) | undefined
    mockDeleteMutateAsync.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )
    mockUseTransactionList.mockReturnValue({
      data: {
        items: [deletableTransaction],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
    })

    render(<TransactionList card={{ ...card, lastReconciledAt: null }} />)
    fireEvent.click(screen.getByTitle('common.delete'))

    const actionButtons = screen.getAllByRole('button', { name: 'common.delete' })
    fireEvent.click(actionButtons[actionButtons.length - 1])

    expect(screen.getByText('transactions.deleteConfirmTitle')).toBeInTheDocument()
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('transaction-1')

    resolveDelete?.()
    await waitFor(() => {
      expect(screen.queryByText('transactions.deleteConfirmTitle')).not.toBeInTheDocument()
    })
  })
})
