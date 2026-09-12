import { render, screen, within } from '@testing-library/react'
import type { IDashboardCard, IDashboardReminder, IDashboardSnapshot } from '@/shared'
import { CreditCardGrid } from './credit-card-grid'
import { CreditCardTile } from './credit-card-tile'
import { DashboardView } from './dashboard-view'
import { SummaryGrid } from './summary-grid'
import { UpcomingReminders } from './upcoming-reminders'

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
}))

const fullCard: IDashboardCard = {
  id: 'card-1',
  bankName: 'Vietcombank',
  bankCode: 'vietcombank',
  cardType: 'VISA',
  bankShortName: 'Vietcombank',
  logoPath: '/images/banks/vietcombank.svg',
  cardName: 'Platinum',
  lastFourDigits: '1234',
  cardNumberMasked: '1234',
  creditLimit: '50000000.00',
  currentBalance: '12500000.00',
  availableCredit: '37500000.00',
  utilizationPercent: 25,
  nextDueDate: '2026-09-15',
  daysUntilDue: 11,
  statementDate: '2026-08-20',
  expiryStatus: 'valid',
  expiryMonth: 12,
  expiryYear: 2028,
}

describe('dashboard presentation', () => {
  it('renders summary values, unknown-limit notice, and clamps visual progress', () => {
    const { rerender } = render(
      <SummaryGrid
        summary={{
          cardCount: 2,
          totalCreditLimit: '100000000.00',
          totalCurrentBalance: '125000000.00',
          availableCredit: '-25000000.00',
          utilizationPercent: 125,
          hasUnknownLimits: true,
        }}
      />,
    )
    expect(screen.getByText('125%')).toBeInTheDocument()
    expect(screen.getByText('unknownLimits')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'utilization' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )

    rerender(
      <SummaryGrid
        summary={{
          cardCount: 0,
          totalCreditLimit: '0.00',
          totalCurrentBalance: '0.00',
          availableCredit: '0.00',
          utilizationPercent: null,
          hasUnknownLimits: false,
        }}
      />,
    )
    expect(screen.queryByRole('progressbar', { name: 'utilization' })).not.toBeInTheDocument()
  })

  it('renders complete, missing, and over-limit card states with one tile component', () => {
    const overLimit: IDashboardCard = {
      ...fullCard,
      id: 'card-2',
      cardName: 'Over-limit',
      lastFourDigits: null,
      cardNumberMasked: null,
      creditLimit: null,
      availableCredit: null,
      utilizationPercent: 130,
      daysUntilDue: null,
      nextDueDate: null,
    }
    const { rerender } = render(<CreditCardTile card={fullCard} />)
    expect(screen.getByText('•••• 1234')).toBeInTheDocument()
    expect(screen.getByText(/cardTypes\.VISA/)).toBeInTheDocument()
    expect(screen.getByText('dueInDays:11')).toBeInTheDocument()
    rerender(<CreditCardTile card={overLimit} />)
    expect(screen.getByText('overLimit')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('notAvailable')).toBeInTheDocument()

    rerender(<CreditCardTile card={{ ...fullCard, daysUntilDue: 0 }} />)
    expect(screen.getByText('dueToday')).toBeInTheDocument()

    rerender(<CreditCardTile card={{ ...fullCard, utilizationPercent: null }} />)
    expect(screen.queryByRole('progressbar', { name: 'utilization' })).not.toBeInTheDocument()

    rerender(<CreditCardTile card={{ ...fullCard, cardType: null }} />)
    expect(screen.getByText(/cardTypeUnavailable/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'cardTypeUnavailable' })).toBeInTheDocument()
  })

  it('uses the shadcn empty state and provides active link to /cards', () => {
    render(<CreditCardGrid cards={[]} />)
    expect(screen.getByText('noCardsTitle')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /addCard/ })
    expect(links).toHaveLength(2)
    links.forEach((link) => expect(link).toHaveAttribute('href', '/cards'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('renders at most five reminders in the provided order', () => {
    const reminders: IDashboardReminder[] = Array.from({ length: 6 }, (_, index) => ({
      id: `reminder-${index}`,
      title: `Reminder ${index}`,
      amount: index === 0 ? null : `${index}000.00`,
      frequency: 'MONTHLY',
      nextTriggerDate: `2026-09-${String(index + 10).padStart(2, '0')}`,
    }))
    render(<UpcomingReminders reminders={reminders} />)
    const list = screen.getByRole('list', { name: 'upcomingReminders' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(within(list).getByText('Reminder 0')).toBeInTheDocument()
    expect(within(list).queryByText('Reminder 5')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /createReminder/ })).toBeDisabled()
  })

  it('composes all sections from one snapshot without fetching', () => {
    const snapshot: IDashboardSnapshot = {
      generatedAt: '2026-09-04T00:00:00.000Z',
      summary: {
        cardCount: 1,
        totalCreditLimit: '50000000.00',
        totalCurrentBalance: '12500000.00',
        availableCredit: '37500000.00',
        utilizationPercent: 25,
        hasUnknownLimits: false,
      },
      cards: [fullCard],
      upcomingReminders: [],
    }
    const fetchSpy = jest.spyOn(global, 'fetch')
    render(<DashboardView snapshot={snapshot} />)
    expect(screen.getByRole('heading', { level: 1, name: 'title' })).toBeInTheDocument()
    expect(screen.getByText('Platinum')).toBeInTheDocument()
    expect(screen.getByText('noRemindersTitle')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
