import { formatLocalIsoDate } from './transaction-form'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('formatLocalIsoDate', () => {
  it('preserves the local calendar date in YYYY-MM-DD format', () => {
    const localDate = new Date(2026, 8, 9, 0, 0, 0)

    expect(formatLocalIsoDate(localDate)).toBe('2026-09-09')
  })
})
