const DEFAULT_FALLBACK = '—'

export function formatVnd(
  value: string | null,
  locale = 'vi-VN',
  fallback = DEFAULT_FALLBACK,
): string {
  if (value === null || !/^-?\d+(\.\d+)?$/.test(value)) return fallback
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export function formatPercentage(
  value: number | null,
  locale = 'vi-VN',
  fallback = DEFAULT_FALLBACK,
): string {
  if (value === null || !Number.isFinite(value)) return fallback
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

export function clampProgress(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function formatMaskedCard(value: string | null, fallback = DEFAULT_FALLBACK): string {
  if (!value) return fallback
  const digits = value.replace(/\D/g, '').slice(-4)
  return digits ? `•••• ${digits}` : fallback
}

export function formatCalendarDate(
  value: string | null,
  locale = 'vi-VN',
  fallback = DEFAULT_FALLBACK,
): string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(`${value}T00:00:00.000Z`)
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return fallback
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function getUserInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || '?'
  const words = source.split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}
