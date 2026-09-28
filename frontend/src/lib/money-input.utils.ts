/**
 * Money Input Utilities for Credit Reminder
 *
 * Implements precision-safe string formatting and parsing for monetary form inputs.
 * Money inputs are whole-đồng fields: they display a comma thousand group separator and no
 * fractional part (e.g. '400,000'), and the 'đ' symbol is rendered beside the input instead of
 * inside its editable value.
 * Canonical API serialization produces unformatted decimal strings (e.g. '400000.00').
 */

/** Integer digits a `DECIMAL(15, 2)` money column can store. */
export const MONEY_INPUT_MAX_INTEGER_DIGITS = 13

/** A decimal fraction of one or two digits at the very end of a value, i.e. đồng cents. */
const CENTS_FRACTION_PATTERN = /\.(\d{1,2})$/

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
  return integer.length <= MONEY_INPUT_MAX_INTEGER_DIGITS && fractionDigits.length <= 2
}

/**
 * Adds one to a digit string without going through `Number`, so amounts beyond the safe-integer
 * range still round correctly.
 */
function incrementDigits(digits: string): string {
  const chars = digits.split('')
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    if (chars[index] !== '9') {
      chars[index] = String(Number(chars[index]) + 1)
      return chars.join('')
    }
    chars[index] = '0'
  }
  return `1${chars.join('')}`
}

/**
 * Rounds đồng cents away into whole đồng, with halves rounded away from zero to match the
 * `halfExpand` rounding `Intl.NumberFormat` applies everywhere else these amounts are rendered.
 */
function roundCentsToWholeDong(integerDigits: string, fractionDigits: string): string {
  const digits = integerDigits || '0'
  const cents = Number(fractionDigits.padEnd(2, '0').slice(0, 2))
  return cents >= 50 ? incrementDigits(digits) : digits
}

/**
 * Adds thousand separator commas to an integer string.
 */
function addThousandSeparators(intStr: string): string {
  if (!intStr) return '0'
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Formats a canonical or raw monetary value for a money input (e.g. '400,000').
 * Cents are rounded into whole đồng and the 'đ' symbol is left to the input itself.
 * Returns an empty string for empty or non-numeric inputs.
 */
export function formatMoneyForInput(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return ''
  const str = (typeof raw === 'number' ? expandExponentialNumber(raw) : raw).trim()
  if (!str || !isValidMoneySyntax(str)) return ''

  const { isNegative, integerDigits, fractionDigits, hasAnyDigit } = extractMoneyParts(str)
  if (!hasAnyDigit) return ''
  if (fractionDigits.length > 2) return ''

  const digits = roundCentsToWholeDong(integerDigits, fractionDigits)
  return groupMoneyDigits(isNegative && /[1-9]/.test(digits) ? `-${digits}` : digits)
}

/**
 * Reduces arbitrary typed or pasted text to the digit string of a whole-đồng amount, keeping a
 * single leading '-'.
 *
 * A trailing one- or two-digit decimal fraction is read as đồng cents and rounded away; every other
 * separator is discarded as digit grouping, so both '400,000.00đ' and '1.234.567' survive as the
 * amount the user meant. The result is deliberately uncapped: the caller decides whether an amount
 * wider than `MONEY_INPUT_MAX_INTEGER_DIGITS` is rejected or truncated.
 */
export function sanitizeMoneyInputDigits(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return ''
  const trimmed = String(raw).trim()
  if (!trimmed) return ''

  const isNegative = trimmed.startsWith('-')
  let body = (isNegative ? trimmed.slice(1) : trimmed).replace(/đ/g, '').replace(/\s/g, '')

  const centsMatch = body.match(CENTS_FRACTION_PATTERN)
  const fractionDigits = centsMatch ? centsMatch[1] : ''
  if (centsMatch) body = body.slice(0, -centsMatch[0].length)

  const integerDigits = body.replace(/\D/g, '')
  if (!integerDigits && !fractionDigits) return ''

  const digits = roundCentsToWholeDong(integerDigits, fractionDigits).replace(/^0+/, '') || '0'
  return isNegative && digits !== '0' ? `-${digits}` : digits
}

/**
 * Groups a digit string (optionally signed) into the money input's display form (e.g. '400,000').
 */
export function groupMoneyDigits(digits: string): string {
  const isNegative = digits.startsWith('-')
  const unsigned = isNegative ? digits.slice(1) : digits
  if (!unsigned) return ''
  return `${isNegative ? '-' : ''}${addThousandSeparators(unsigned)}`
}

/**
 * Returns the caret offset that sits immediately after the `digitIndex`-th digit of a grouped
 * value, which is how a caret survives group separators being inserted or removed around it.
 * A `digitIndex` of 0 resolves to the offset just before the first digit.
 */
export function caretOffsetForDigitIndex(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) {
    const firstDigit = formatted.search(/\d/)
    return firstDigit === -1 ? formatted.length : firstDigit
  }

  let seen = 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (!/\d/.test(formatted[index])) continue
    seen += 1
    if (seen === digitIndex) return index + 1
  }
  return formatted.length
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
