import {
  caretOffsetForDigitIndex,
  formatMoneyForInput,
  groupMoneyDigits,
  parseMoneyInputToCanonicalDecimal,
  sanitizeMoneyInputDigits,
} from './money-input.utils'

describe('money-input.utils', () => {
  describe('formatMoneyForInput', () => {
    it('formats 400000 to 400,000', () => {
      expect(formatMoneyForInput('400000')).toBe('400,000')
      expect(formatMoneyForInput(400000)).toBe('400,000')
    })

    it('drops a zero cents fraction from a canonical value', () => {
      expect(formatMoneyForInput('50000000.00')).toBe('50,000,000')
    })

    it('rounds a stored cents fraction away from zero', () => {
      expect(formatMoneyForInput('50000000.50')).toBe('50,000,001')
      expect(formatMoneyForInput('400000.75')).toBe('400,001')
      expect(formatMoneyForInput('400000.49')).toBe('400,000')
    })

    it('keeps the sign of a negative stored amount', () => {
      expect(formatMoneyForInput('-2500000.00')).toBe('-2,500,000')
      expect(formatMoneyForInput('-50000')).toBe('-50,000')
    })

    it('formats zero correctly', () => {
      expect(formatMoneyForInput('0')).toBe('0')
      expect(formatMoneyForInput(0)).toBe('0')
      expect(formatMoneyForInput('0.00')).toBe('0')
    })

    it('handles leading zeros by stripping them', () => {
      expect(formatMoneyForInput('00400')).toBe('400')
      expect(formatMoneyForInput('000')).toBe('0')
    })

    it('is idempotent over its own output', () => {
      expect(formatMoneyForInput('400,000')).toBe('400,000')
    })

    it('formats very large numbers safely without floating-point precision loss', () => {
      expect(formatMoneyForInput('999999999999999.99')).toBe('1,000,000,000,000,000')
    })

    it('expands a numeric exponential value instead of treating its exponent as digits', () => {
      expect(formatMoneyForInput(1e21)).toBe('1,000,000,000,000,000,000,000')
    })

    it('returns empty string for null, undefined, empty, or non-numeric input', () => {
      expect(formatMoneyForInput(null)).toBe('')
      expect(formatMoneyForInput(undefined)).toBe('')
      expect(formatMoneyForInput('')).toBe('')
      expect(formatMoneyForInput('   ')).toBe('')
      expect(formatMoneyForInput('abc')).toBe('')
    })

    it('rejects malformed stored text instead of extracting digits from it', () => {
      expect(formatMoneyForInput('12abc34')).toBe('')
      expect(formatMoneyForInput('1,,000')).toBe('')
      expect(formatMoneyForInput('1.2.3')).toBe('')
    })

    it('rejects values with more than two fractional digits', () => {
      expect(formatMoneyForInput('400000.001')).toBe('')
    })
  })

  describe('sanitizeMoneyInputDigits', () => {
    it('keeps the digits of a plain typed amount', () => {
      expect(sanitizeMoneyInputDigits('400000')).toBe('400000')
      expect(sanitizeMoneyInputDigits('400,000')).toBe('400000')
    })

    it('rounds a trailing cents fraction into whole đồng', () => {
      expect(sanitizeMoneyInputDigits('400,000.00đ')).toBe('400000')
      expect(sanitizeMoneyInputDigits('400000.75')).toBe('400001')
      expect(sanitizeMoneyInputDigits('400000.5')).toBe('400001')
      expect(sanitizeMoneyInputDigits('400000.49')).toBe('400000')
    })

    it('reads dot-grouped separators as grouping rather than a fraction', () => {
      expect(sanitizeMoneyInputDigits('1.234.567')).toBe('1234567')
      expect(sanitizeMoneyInputDigits('400.000')).toBe('400000')
    })

    it('discards characters that are not part of an amount', () => {
      expect(sanitizeMoneyInputDigits('400a')).toBe('400')
      expect(sanitizeMoneyInputDigits('400 000')).toBe('400000')
      expect(sanitizeMoneyInputDigits('400đ')).toBe('400')
    })

    it('ignores a decimal point that has no cents behind it', () => {
      expect(sanitizeMoneyInputDigits('400.')).toBe('400')
      expect(sanitizeMoneyInputDigits('.')).toBe('')
    })

    it('strips leading zeros without erasing a lone zero', () => {
      expect(sanitizeMoneyInputDigits('000400')).toBe('400')
      expect(sanitizeMoneyInputDigits('0')).toBe('0')
      expect(sanitizeMoneyInputDigits('000')).toBe('0')
    })

    it('keeps a single leading minus sign', () => {
      expect(sanitizeMoneyInputDigits('-2,500,000')).toBe('-2500000')
      expect(sanitizeMoneyInputDigits('-2500000.50')).toBe('-2500001')
      expect(sanitizeMoneyInputDigits('-0')).toBe('0')
    })

    it('does not truncate an over-wide amount, leaving the cap to the caller', () => {
      expect(sanitizeMoneyInputDigits('12345678901234')).toBe('12345678901234')
    })

    it('returns empty string for empty or digitless input', () => {
      expect(sanitizeMoneyInputDigits(null)).toBe('')
      expect(sanitizeMoneyInputDigits(undefined)).toBe('')
      expect(sanitizeMoneyInputDigits('')).toBe('')
      expect(sanitizeMoneyInputDigits('abc')).toBe('')
    })
  })

  describe('groupMoneyDigits', () => {
    it('groups digits in threes from the right', () => {
      expect(groupMoneyDigits('400000')).toBe('400,000')
      expect(groupMoneyDigits('4')).toBe('4')
      expect(groupMoneyDigits('4000')).toBe('4,000')
    })

    it('groups a negative amount behind its sign', () => {
      expect(groupMoneyDigits('-2500000')).toBe('-2,500,000')
    })

    it('returns empty string for an empty digit string', () => {
      expect(groupMoneyDigits('')).toBe('')
      expect(groupMoneyDigits('-')).toBe('')
    })
  })

  describe('caretOffsetForDigitIndex', () => {
    it('places the caret immediately after the Nth digit', () => {
      expect(caretOffsetForDigitIndex('400,000', 1)).toBe(1)
      expect(caretOffsetForDigitIndex('400,000', 3)).toBe(3)
      expect(caretOffsetForDigitIndex('400,000', 4)).toBe(5)
      expect(caretOffsetForDigitIndex('400,000', 6)).toBe(7)
    })

    it('places a zero digit index before the first digit', () => {
      expect(caretOffsetForDigitIndex('400,000', 0)).toBe(0)
      expect(caretOffsetForDigitIndex('-2,500', 0)).toBe(1)
      expect(caretOffsetForDigitIndex('', 0)).toBe(0)
    })

    it('clamps a digit index beyond the value to the end of the value', () => {
      expect(caretOffsetForDigitIndex('400,000', 9)).toBe(7)
    })
  })

  describe('round-trip serialization', () => {
    it('round-trips 400000 -> 400,000 -> 400000.00', () => {
      const display = formatMoneyForInput('400000')
      expect(display).toBe('400,000')
      expect(parseMoneyInputToCanonicalDecimal(display)).toBe('400000.00')
    })

    it('round-trips a negative stored amount without changing it', () => {
      const display = formatMoneyForInput('-2500000.00')
      expect(display).toBe('-2,500,000')
      expect(parseMoneyInputToCanonicalDecimal(display)).toBe('-2500000.00')
    })
  })

  describe('parseMoneyInputToCanonicalDecimal', () => {
    it('parses the grouped display grammar the money input emits', () => {
      expect(parseMoneyInputToCanonicalDecimal('400,000')).toBe('400000.00')
      expect(parseMoneyInputToCanonicalDecimal('50,000,000')).toBe('50000000.00')
    })

    it('still parses the legacy suffixed and raw decimal forms', () => {
      expect(parseMoneyInputToCanonicalDecimal('400,000.00đ')).toBe('400000.00')
      expect(parseMoneyInputToCanonicalDecimal('400000')).toBe('400000.00')
      expect(parseMoneyInputToCanonicalDecimal('400000.5')).toBe('400000.50')
    })

    it('parses zero to canonical 0.00', () => {
      expect(parseMoneyInputToCanonicalDecimal('0')).toBe('0.00')
      expect(parseMoneyInputToCanonicalDecimal('0.00đ')).toBe('0.00')
    })

    it('parses negative amounts to canonical negative decimal string', () => {
      expect(parseMoneyInputToCanonicalDecimal('-50,000')).toBe('-50000.00')
      expect(parseMoneyInputToCanonicalDecimal('-50000')).toBe('-50000.00')
    })

    it('parses the largest DECIMAL(15,2) value without precision loss', () => {
      expect(parseMoneyInputToCanonicalDecimal('9,999,999,999,999.99đ')).toBe('9999999999999.99')
    })

    it('rejects canonical values outside DECIMAL(15,2) precision', () => {
      expect(parseMoneyInputToCanonicalDecimal('10000000000000.00')).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('1.001')).toBe('')
    })

    it('rejects malformed pasted text instead of silently changing the amount', () => {
      expect(parseMoneyInputToCanonicalDecimal('12abc34')).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('1,00')).toBe('')
    })

    it('returns empty string for empty or non-numeric values', () => {
      expect(parseMoneyInputToCanonicalDecimal(null)).toBe('')
      expect(parseMoneyInputToCanonicalDecimal(undefined)).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('')).toBe('')
      expect(parseMoneyInputToCanonicalDecimal('invalid')).toBe('')
    })
  })
})
