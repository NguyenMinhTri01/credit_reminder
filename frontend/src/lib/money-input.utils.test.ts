import {
  formatMoneyInputDisplay,
  parseMoneyInputToCanonicalDecimal,
} from './money-input.utils'

describe('money-input.utils', () => {
  describe('formatMoneyInputDisplay', () => {
    it('formats 400000 to 400,000.00đ', () => {
      expect(formatMoneyInputDisplay('400000')).toBe('400,000.00đ')
      expect(formatMoneyInputDisplay(400000)).toBe('400,000.00đ')
    })

    it('formats values already having decimals', () => {
      expect(formatMoneyInputDisplay('400000.00')).toBe('400,000.00đ')
      expect(formatMoneyInputDisplay('400000.5')).toBe('400,000.50đ')
      expect(formatMoneyInputDisplay('400000.75')).toBe('400,000.75đ')
    })

    it('handles idempotent formatting without duplicating currency suffix', () => {
      expect(formatMoneyInputDisplay('400,000.00đ')).toBe('400,000.00đ')
      expect(formatMoneyInputDisplay('400,000.00 đ')).toBe('400,000.00đ')
    })

    it('formats zero correctly', () => {
      expect(formatMoneyInputDisplay('0')).toBe('0.00đ')
      expect(formatMoneyInputDisplay(0)).toBe('0.00đ')
    })

    it('handles leading zeros by stripping them', () => {
      expect(formatMoneyInputDisplay('00400')).toBe('400.00đ')
      expect(formatMoneyInputDisplay('000')).toBe('0.00đ')
    })

    it('handles negative values', () => {
      expect(formatMoneyInputDisplay('-50000')).toBe('-50,000.00đ')
      expect(formatMoneyInputDisplay('-50,000.00đ')).toBe('-50,000.00đ')
    })

    it('formats very large numbers safely without floating-point precision loss', () => {
      expect(formatMoneyInputDisplay('999999999999999.99')).toBe('999,999,999,999,999.99đ')
    })

    it('expands a numeric exponential value instead of treating its exponent as digits', () => {
      expect(formatMoneyInputDisplay(1e21)).toBe('1,000,000,000,000,000,000,000.00đ')
    })

    it('returns empty string for null, undefined, empty, or non-numeric input', () => {
      expect(formatMoneyInputDisplay(null)).toBe('')
      expect(formatMoneyInputDisplay(undefined)).toBe('')
      expect(formatMoneyInputDisplay('')).toBe('')
      expect(formatMoneyInputDisplay('   ')).toBe('')
      expect(formatMoneyInputDisplay('abc')).toBe('')
    })
  })

  describe('parseMoneyInputToCanonicalDecimal', () => {
    it('parses formatted 400,000.00đ to canonical 400000.00', () => {
      expect(parseMoneyInputToCanonicalDecimal('400,000.00đ')).toBe('400000.00')
    })

    it('parses raw unformatted integer string to canonical decimal string', () => {
      expect(parseMoneyInputToCanonicalDecimal('400000')).toBe('400000.00')
    })

    it('parses single-digit fraction to 2 decimals', () => {
      expect(parseMoneyInputToCanonicalDecimal('400000.5')).toBe('400000.50')
    })

    it('parses zero to canonical 0.00', () => {
      expect(parseMoneyInputToCanonicalDecimal('0')).toBe('0.00')
      expect(parseMoneyInputToCanonicalDecimal('0.00đ')).toBe('0.00')
    })

    it('parses negative amounts to canonical negative decimal string', () => {
      expect(parseMoneyInputToCanonicalDecimal('-50,000.00đ')).toBe('-50000.00')
      expect(parseMoneyInputToCanonicalDecimal('-50000')).toBe('-50000.00')
    })

    it('parses the largest DECIMAL(15,2) value without precision loss', () => {
      expect(parseMoneyInputToCanonicalDecimal('9,999,999,999,999.99đ')).toBe(
        '9999999999999.99',
      )
    })

    it('rejects canonical values outside DECIMAL(15,2) precision', () => {
      expect(parseMoneyInputToCanonicalDecimal('10000000000000.00')).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('1.001')).toBe('')
    })

    it('returns empty string for empty or non-numeric values', () => {
      expect(parseMoneyInputToCanonicalDecimal(null)).toBe('')
      expect(parseMoneyInputToCanonicalDecimal(undefined)).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('')).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('invalid')).toBe('')
    })
  })

  describe('round-trip serialization', () => {
    it('round-trips 400000 -> 400,000.00đ -> 400000.00', () => {
      const display = formatMoneyInputDisplay('400000')
      expect(display).toBe('400,000.00đ')
      const canonical = parseMoneyInputToCanonicalDecimal(display)
      expect(canonical).toBe('400000.00')
    })
  })
})
