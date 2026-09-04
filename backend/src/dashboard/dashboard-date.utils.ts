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

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isoDate({ year, month, day }: CalendarDateParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayIso(date: Date, timeZone = DEFAULT_APP_TIME_ZONE): string {
  return isoDate(getCalendarDateParts(date, timeZone));
}

export function calculateNextDueDate(
  dueDay: number | null,
  now: Date,
  timeZone = DEFAULT_APP_TIME_ZONE,
): NextDueDate | null {
  if (dueDay === null || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return null;
  }

  const current = getCalendarDateParts(now, timeZone);
  let targetYear = current.year;
  let targetMonth = current.month;

  if (dueDay < current.day) {
    targetMonth += 1;
    if (targetMonth === 13) {
      targetMonth = 1;
      targetYear += 1;
    }
  }

  const target: CalendarDateParts = {
    year: targetYear,
    month: targetMonth,
    day: Math.min(dueDay, daysInMonth(targetYear, targetMonth)),
  };
  const currentUtc = Date.UTC(current.year, current.month - 1, current.day);
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day);

  return {
    nextDueDate: isoDate(target),
    daysUntilDue: Math.round((targetUtc - currentUtc) / 86_400_000),
  };
}
