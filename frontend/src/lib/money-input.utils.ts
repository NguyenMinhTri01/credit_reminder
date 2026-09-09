/**
 * Money Input Utilities for Credit Reminder
 *
 * Implements precision-safe string formatting and parsing for monetary form inputs.
 * Formatting follows the project standard: comma thousand group separator, dot decimal separator,
 * exactly two decimal places, and a single 'đ' suffix (e.g. '400,000.00đ').
 * Canonical API serialization produces unformatted decimal strings (e.g. '400000.00').
 */

/**
 * Strips presentation characters and returns the sign, raw integer digits, and fraction digits.
 */
function extractMoneyParts(input: string): {
  isNegative: boolean
  integerDigits: string
  fractionDigits: string
  hasDecimalPoint: boolean
  hasAnyDigit: boolean
} {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      isNegative: false,
      integerDigits: '',
      fractionDigits: '',
      hasDecimalPoint: false,
      hasAnyDigit: false,
    }
  }

  const isNegative = trimmed.startsWith('-')
  const unsigned = isNegative ? trimmed.slice(1) : trimmed
  const cleaned = unsigned.replace(/,/g, '').replace(/đ$/, '').trim()

  // Handle multiple decimal points: keep first, ignore subsequent ones
  const parts = cleaned.split('.')
  const hasDecimalPoint = parts.length > 1
  let integerDigits = parts[0] || ''
  const fractionDigits = hasDecimalPoint ? parts.slice(1).join('') : ''

  // Normalize integer digits: strip leading zeros unless it is just "0"
  if (integerDigits.length > 1 && /^0+$/.test(integerDigits)) {
    integerDigits = '0'
  } else if (integerDigits.length > 1 && integerDigits.startsWith('0')) {
    integerDigits = integerDigits.replace(/^0+/, '')
    if (!integerDigits) integerDigits = '0'
  }

  const hasAnyDigit = integerDigits.length > 0 || fractionDigits.length > 0

  return {
    isNegative: isNegative && hasAnyDigit,
    integerDigits,
    fractionDigits,
    hasDecimalPoint,
    hasAnyDigit,
  }
}

/**
 * Accept only the presentation grammar emitted by this module or a raw decimal being typed.
 * Invalid pasted text is rejected instead of being silently converted into another amount.
 */
function isValidMoneySyntax(input: string): boolean {
  let value = input.trim()
  if (value.endsWith('đ')) value = value.slice(0, -1).trimEnd()
  if (!value || value.includes('đ')) return false

  return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{0,2})?$/.test(value) &&
    /\d/.test(value)
}

function expandExponentialNumber(value: number): string {
  const input = String(value)
  if (!/[eE]/.test(input)) return input

  const [coefficient, exponentRaw] = input.toLowerCase().split('e')
  const exponent = Number(exponentRaw)
  if (!Number.isInteger(exponent)) return ''

  const sign = coefficient.startsWith('-') ? '-' : ''
  const unsigned = sign ? coefficient.slice(1) : coefficient
  const [integer = '', fraction = ''] = unsigned.split('.')
  const digits = `${integer}${fraction}`.replace(/^0+/, '') || '0'
  const decimalIndex = integer.length + exponent

  if (decimalIndex <= 0) return `${sign}0.${'0'.repeat(-decimalIndex)}${digits}`
  if (decimalIndex >= digits.length) return `${sign}${digits}${'0'.repeat(decimalIndex - digits.length)}`
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`
}

function isStoragePrecisionSupported(integerDigits: string, fractionDigits: string): boolean {
  const integer = integerDigits.replace(/^0+/, '') || '0'
  return integer.length <= 13 && fractionDigits.length <= 2
}

/**
 * Adds thousand separator commas to an integer string.
 */
function addThousandSeparators(intStr: string): string {
  if (!intStr) return '0'
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Formats a monetary string or number for input display (e.g. '400,000.00đ').
 * Always renders two decimal places and a single 'đ' suffix when valid digits exist.
 * Returns an empty string for empty or non-numeric inputs.
 */
export function formatMoneyInputDisplay(
  raw: string | number | null | undefined,
): string {
  if (raw === null || raw === undefined) return ''
  const str = (typeof raw === 'number' ? expandExponentialNumber(raw) : raw).trim()
  if (!str || !isValidMoneySyntax(str)) return ''

  const { isNegative, integerDigits, fractionDigits, hasAnyDigit } = extractMoneyParts(str)
  if (!hasAnyDigit) return ''
  if (fractionDigits.length > 2) return ''

  const intPart = integerDigits || '0'
  const formattedInt = addThousandSeparators(intPart)
  const fracPart = fractionDigits.padEnd(2, '0')
  const sign = isNegative ? '-' : ''

  return `${sign}${formattedInt}.${fracPart}đ`
}

/**
 * Parses any formatted or raw monetary input into a canonical decimal string (e.g. '400000.00').
 * Suitable for API requests. Strips commas, currency symbols, and whitespace.
 * Returns an empty string for empty or non-numeric inputs.
 */
export function parseMoneyInputToCanonicalDecimal(
  value: string | null | undefined,
): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  if (!str || !isValidMoneySyntax(str)) return ''

  const { isNegative, integerDigits, fractionDigits, hasAnyDigit } = extractMoneyParts(str)
  if (!hasAnyDigit) return ''
  if (!isStoragePrecisionSupported(integerDigits, fractionDigits)) return ''

  const intPart = integerDigits || '0'
  const fracPart = fractionDigits.padEnd(2, '0')
  const sign = isNegative ? '-' : ''

  return `${sign}${intPart}.${fracPart}`
}
