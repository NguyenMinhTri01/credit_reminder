import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EditCardSheet } from './edit-card-sheet'
import type { ICreditCard } from '@/shared'

const mutateAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/hooks/use-credit-cards', () => ({
  useUpdateCard: () => ({ isPending: false, mutateAsync }),
}))

jest.mock('@/components/cards/card-form', () => ({
  CardForm: ({ onSubmit }: { onSubmit: (values: Record<string, unknown>) => Promise<void> }) => (
    <button
      type="button"
      onClick={() =>
        void onSubmit({
          bankCode: 'vietcombank',
          cardName: '',
          lastFourDigits: '1234',
          creditLimit: '50,000,000.00đ',
          availableCredit: '30,000,000.00đ',
          statementDay: 5,
          paymentDueDaysAfterStatement: 20,
          expiryRaw: '',
        })
      }
    >
      save
    </button>
  ),
  parseExpiryRaw: () => ({}),
}))

const card: ICreditCard = {
  id: 'card-1',
  userId: 'user-1',
  bankCode: 'vietcombank',
  bankName: 'Vietcombank',
  bankShortName: 'VCB',
  logoPath: null,
  cardName: 'Original',
  lastFourDigits: '1234',
  cardNumberMasked: null,
  creditLimit: '50000000.00',
  availableCredit: '30000000.00',
  utilizationPercent: 40,
  statementDay: 5,
  paymentDueDaysAfterStatement: 20,
  dueDay: null,
  expiryMonth: null,
  expiryYear: null,
  expiryStatus: null,
  scheduleInfo: { statementDate: null, nextDueDate: null, daysUntilDue: null },
  lastReconciledAt: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('EditCardSheet', () => {
  beforeEach(() => {
    mutateAsync.mockClear()
  })

  it('sends an explicit empty card name without sending an unchanged formatted limit', async () => {
    render(<EditCardSheet card={card} open onOpenChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'card-1',
        payload: { cardName: '' },
      })
    })
  })
})
