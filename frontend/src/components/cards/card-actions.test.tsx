import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

import { CardTile } from './card-tile'
import { DeleteCardDialog } from './delete-card-dialog'
import type { ICreditCard } from '@/shared'

const mutateAsync = jest.fn()

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}))

jest.mock('@/hooks/use-credit-cards', () => ({
  useDeleteCard: () => ({ isPending: false, mutateAsync }),
  useRestoreCard: () => ({ isPending: false, mutateAsync }),
}))

jest.mock('@/components/cards/bank-logo', () => ({
  BankLogo: ({ bankName }: { bankName: string | null }) => <span>{bankName}</span>,
}))

jest.mock('@/components/cards/edit-card-sheet', () => ({
  EditCardSheet: () => null,
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => null,
}))

const card: ICreditCard = {
  id: 'card-1',
  userId: 'user-1',
  bankCode: 'vietcombank',
  bankName: 'Vietcombank',
  bankShortName: 'VCB',
  logoPath: '/images/banks/vietcombank.svg',
  cardName: 'Visa',
  lastFourDigits: '1234',
  cardNumberMasked: '•••• 1234',
  creditLimit: '50000000.00',
  availableCredit: '30000000.00',
  utilizationPercent: 40,
  statementDay: 15,
  paymentDueDaysAfterStatement: 20,
  dueDay: null,
  expiryMonth: 12,
  expiryYear: 2028,
  expiryStatus: 'valid',
  scheduleInfo: {
    statementDate: '2026-08-15',
    nextDueDate: '2026-09-04',
    daysUntilDue: 5,
  },
  lastReconciledAt: null,
  deletedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

describe('card actions translations', () => {
  it('uses the common cancel label in the delete dialog', () => {
    render(<DeleteCardDialog card={card} open onOpenChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
  })

  it('uses translated labels in the card action menu', () => {
    render(<CardTile card={card} onViewDetail={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'common.actions' })).toBeInTheDocument()
    expect(screen.getByText('cards.viewDetail')).toBeInTheDocument()
  })
})
