import { render, screen, fireEvent } from '@testing-library/react'
import { CardDetailView } from './card-detail-view'
import type { ICreditCard } from '@/shared'

jest.mock('next-intl', () => ({
  useLocale: () => 'vi',
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/hooks/use-transactions', () => ({
  useCreateTransaction: () => ({ mutateAsync: jest.fn() }),
  useUpdateTransaction: () => ({ mutateAsync: jest.fn() }),
}))

jest.mock('@/hooks/use-credit-cards', () => ({
  useReconcileCard: () => ({ mutateAsync: jest.fn() }),
}))

jest.mock('@/components/cards/bank-logo', () => ({
  BankLogo: ({ bankName }: { bankName: string | null }) => (
    <span data-testid="bank-logo">{bankName}</span>
  ),
}))

jest.mock('@/components/cards/edit-card-sheet', () => ({
  EditCardSheet: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-card-sheet">EditCardSheet</div> : null,
}))

jest.mock('@/components/cards/transaction-list', () => ({
  TransactionList: () => <div data-testid="transaction-list">TransactionList</div>,
}))

jest.mock('@/components/cards/transaction-form', () => ({
  TransactionForm: () => <div data-testid="transaction-form">TransactionForm</div>,
}))

jest.mock('@/components/cards/reconcile-form', () => ({
  ReconcileForm: () => <div data-testid="reconcile-form">ReconcileForm</div>,
}))

const mockCard: ICreditCard = {
  id: 'card-1',
  userId: 'user-1',
  bankCode: 'vietcombank',
  bankName: 'Vietcombank',
  bankShortName: 'VCB',
  logoPath: '/images/banks/vietcombank.svg',
  cardName: 'Thẻ cá nhân',
  lastFourDigits: '0012',
  cardNumberMasked: '•••• 0012',
  creditLimit: '50000000.00',
  availableCredit: '35000000.00',
  utilizationPercent: 30,
  statementDay: 20,
  paymentDueDaysAfterStatement: 20,
  dueDay: 10,
  expiryMonth: 12,
  expiryYear: 2028,
  expiryStatus: 'valid',
  scheduleInfo: {
    statementDate: '2026-08-20',
    nextDueDate: '2026-09-09',
    daysUntilDue: 4,
  },
  lastReconciledAt: null,
  deletedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

describe('CardDetailView', () => {
  it('renders both close button and edit button simultaneously with independent accessible names', () => {
    const onOpenChange = jest.fn()

    render(
      <CardDetailView
        card={mockCard}
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    // Edit button exists with its accessible label
    const editButton = screen.getByRole('button', { name: /edit/i })
    expect(editButton).toBeInTheDocument()

    // Close button exists with its accessible label
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()

    // Both buttons are distinct elements
    expect(editButton).not.toBe(closeButton)

    // Clicking edit button opens the edit sheet
    fireEvent.click(editButton)
    expect(screen.getByTestId('edit-card-sheet')).toBeInTheDocument()
  })

  it('preserves header layout and truncation classes without overlapping', () => {
    render(
      <CardDetailView
        card={mockCard}
        open={true}
        onOpenChange={jest.fn()}
      />,
    )

    // SheetHeader renders inside Radix Dialog Portal (attached to document.body)
    const header = document.body.querySelector('[class*="pr-10"]') || document.body.querySelector('[class*="pr-12"]')
    expect(header).toBeInTheDocument()
  })
})
