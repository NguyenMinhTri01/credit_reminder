import { DEFAULT_APP_TIME_ZONE } from './schedule.utils';

export type ExpiryStatusValue = 'valid' | 'expiring_soon' | 'expired';

export interface ExpiryInfo {
  expiryDate: string; // ISO date: last day of expiry month (YYYY-MM-DD)
  warningStartDate: string; // ISO date: 3 calendar months before expiryDate
  status: ExpiryStatusValue;
}

// ─── Internal helpers ────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function compareCalendarDates(
  left: { year: number; month: number; day: number },
  right: { year: number; month: number; day: number },
): number {
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

function getCalendarDatePartsFromDate(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

/**
 * Subtract 3 calendar months from the given year/month/day, clamping to the
 * last day of the resulting month if necessary.
 *
 * Example: 2030-03-31 − 3 months → 2029-12-31 (Dec has 31 days)
 * Example: 2026-05-31 − 3 months → 2026-02-28 (Feb 2026 has 28 days)
 */
function subtractThreeCalendarMonths(year: number, month: number, day: number): string {
  let targetMonth = month - 3;
  let targetYear = year;

  while (targetMonth <= 0) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return isoDate(targetYear, targetMonth, targetDay);
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Compute expiry status for a credit card.
 *
 * The card is valid through the **last day** of its expiry month/year.
 * Warning period starts 3 calendar months before that last day (inclusive).
 * Expired status starts the day after the last day of expiry month.
 *
 * @returns ExpiryInfo if both expiryMonth and expiryYear are provided, null otherwise.
 */
export function getExpiryStatus(
  expiryMonth: number | null | undefined,
  expiryYear: number | null | undefined,
  now: Date = new Date(),
  timeZone: string = DEFAULT_APP_TIME_ZONE,
): ExpiryInfo | null {
  if (expiryMonth == null || expiryYear == null) return null;
  if (
    !Number.isInteger(expiryMonth) ||
    expiryMonth < 1 ||
    expiryMonth > 12 ||
    !Number.isInteger(expiryYear) ||
    expiryYear < 1
  ) {
    return null;
  }

  // Last day of expiry month (card is valid through this date)
  const lastDayOfExpiryMonth = daysInMonth(expiryYear, expiryMonth);
  const expiryDate = isoDate(expiryYear, expiryMonth, lastDayOfExpiryMonth);

  // Warning start date: 3 calendar months before expiry date
  const warningStartDate = subtractThreeCalendarMonths(
    expiryYear,
    expiryMonth,
    lastDayOfExpiryMonth,
  );

  // Today in app time zone
  const today = getCalendarDatePartsFromDate(now, timeZone);
  const [warningYear, warningMonth, warningDay] = warningStartDate.split('-').map(Number);
  const expiry = { year: expiryYear, month: expiryMonth, day: lastDayOfExpiryMonth };
  const warningStart = { year: warningYear, month: warningMonth, day: warningDay };

  let status: ExpiryStatusValue;
  if (compareCalendarDates(today, expiry) > 0) {
    status = 'expired';
  } else if (compareCalendarDates(today, warningStart) >= 0) {
    status = 'expiring_soon';
  } else {
    status = 'valid';
  }

  return { expiryDate, warningStartDate, status };
}
