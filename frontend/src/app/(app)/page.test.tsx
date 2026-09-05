import { render, screen } from '@testing-library/react'
import DashboardPage from './page'
import { apiClient } from '@/lib/api-client'
import type { IDashboardSnapshot } from '@/shared'

jest.mock('@/lib/api-client', () => ({ apiClient: { get: jest.fn() } }))
jest.mock('next-intl', () => ({
  useLocale: () => 'vi-VN',
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
}))

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
  cards: [
    {
      id: 'card-1',
      bankName: 'VCB',
      cardName: 'Platinum',
      cardNumberMasked: '1234',
      creditLimit: '50000000.00',
      currentBalance: '12500000.00',
      availableCredit: '37500000.00',
      utilizationPercent: 25,
      nextDueDate: '2026-09-15',
      daysUntilDue: 11,
    },
  ],
  upcomingReminders: [],
}

describe('authenticated root page', () => {
  it('loads one no-store snapshot and renders the dashboard', async () => {
    jest.mocked(apiClient.get).mockResolvedValue(snapshot)
    render(await DashboardPage())

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard', { cache: 'no-store' })
    expect(screen.getByRole('heading', { level: 1, name: 'title' })).toBeInTheDocument()
    expect(screen.getByText('Platinum')).toBeInTheDocument()
  })
})
