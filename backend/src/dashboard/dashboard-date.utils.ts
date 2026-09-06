import { calculateNextPaymentDue } from '@/shared/utils/schedule.utils';

export const DEFAULT_APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

export interface NextDueDate {
  nextDueDate: string;
  daysUntilDue: number;
}

function getCalendarDateParts(date: Date, timeZone: string): CalendarDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function isoDate({ year, month, day }: CalendarDateParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayIso(date: Date, timeZone = DEFAULT_APP_TIME_ZONE): string {
  return isoDate(getCalendarDateParts(date, timeZone));
}

/**
 * @deprecated Use calculateNextPaymentDue from @/shared/utils/schedule.utils instead.
 */
export function calculateNextDueDate(
  dueDay: number | null,
  now: Date,
  timeZone = DEFAULT_APP_TIME_ZONE,
): NextDueDate | null {
  const result = calculateNextPaymentDue(null, null, dueDay, now, timeZone);
  if (!result) return null;
  return {
    nextDueDate: result.nextDueDate,
    daysUntilDue: result.daysUntilDue,
  };
}
