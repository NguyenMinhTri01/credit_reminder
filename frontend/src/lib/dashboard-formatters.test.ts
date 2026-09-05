import {
  clampProgress,
  formatCalendarDate,
  formatMaskedCard,
  formatPercentage,
  formatVnd,
  getUserInitials,
} from './dashboard-formatters'

describe('dashboard formatters', () => {
  it('formats VND and rejects malformed input', () => {
    expect(formatVnd('12500000.00', 'vi-VN')).toContain('12.500.000')
    expect(formatVnd(null)).toBe('—')
    expect(formatVnd('not-money')).toBe('—')
    expect(formatVnd('9'.repeat(400))).toBe('—')
  })

  it('formats percentages without NaN or Infinity', () => {
    expect(formatPercentage(34.5, 'en-US')).toBe('34.5%')
    expect(formatPercentage(null)).toBe('—')
    expect(formatPercentage(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('clamps only visual progress values', () => {
    expect(clampProgress(135)).toBe(100)
    expect(clampProgress(-5)).toBe(0)
    expect(clampProgress(null)).toBe(0)
  })

  it('formats masked cards and calendar dates', () => {
    expect(formatMaskedCard('**** 1234')).toBe('•••• 1234')
    expect(formatMaskedCard(null)).toBe('—')
    expect(formatMaskedCard('masked')).toBe('—')
    expect(formatCalendarDate('2026-09-15', 'vi-VN')).toBe('15/09/2026')
    expect(formatCalendarDate(null)).toBe('—')
    expect(formatCalendarDate('not-a-date')).toBe('—')
    expect(formatCalendarDate('2026-02-30')).toBe('—')
  })

  it('derives a compact avatar fallback', () => {
    expect(getUserInitials('Nguyễn Minh Trí', 'tri@example.com')).toBe('NM')
    expect(getUserInitials(null, 'tri@example.com')).toBe('T')
    expect(getUserInitials('Trí', null)).toBe('T')
    expect(getUserInitials(null, null)).toBe('?')
  })
})
