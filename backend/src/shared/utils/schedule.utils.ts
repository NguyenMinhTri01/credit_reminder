export const DEFAULT_APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface ScheduleInfo {
  statementDate: string;
  nextDueDate: string;
  daysUntilDue: number;
}

// ─── Internal helpers ────────────────────────────────────────

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

function getCalendarDateParts(date: Date, timeZone: string): CalendarDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isoDate({ year, month, day }: CalendarDateParts): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addCalendarDays(parts: CalendarDateParts, days: number): CalendarDateParts {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Clamp a day-of-month to the actual number of days in the given month.
 */
function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Calculate statement close date for the given year/month using statementDay.
 */
function statementCloseDateIso(year: number, month: number, statementDay: number): string {
  return isoDate({ year, month, day: clampDay(year, month, statementDay) });
}

/**
 * Subtract months from a year/month pair, returns { year, month }.
 */
function subtractMonths(
  year: number,
  month: number,
  count: number,
): { year: number; month: number } {
  let m = month - count;
  let y = year;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Calculate the next payment due date using statement-day + grace-period logic.
 *
 * Algorithm:
 * 1. Starting from the current month, look back to find the most recent statement
 *    close date ≤ today.
 * 2. Add `paymentDueDaysAfterStatement` days → candidate due date.
 * 3. If that due date ≥ today → use it.
 * 4. Otherwise advance to the next statement cycle and recalculate.
 *
 * Legacy fallback: if `paymentDueDaysAfterStatement` is null/undefined but `dueDay`
 * is provided, treat `dueDay` as a fixed day-in-month target (existing behavior).
 */
export function calculateNextPaymentDue(
  statementDay: number | null | undefined,
  paymentDueDaysAfterStatement: number | null | undefined,
  dueDay: number | null | undefined,
  now: Date = new Date(),
  timeZone: string = DEFAULT_APP_TIME_ZONE,
): ScheduleInfo | null {
  const today = getCalendarDateParts(now, timeZone);
  const todayIso = isoDate(today);

  // ── Legacy fallback: use fixed dueDay ──
  if (
    (statementDay == null || paymentDueDaysAfterStatement == null) &&
    dueDay != null &&
    Number.isInteger(dueDay) &&
    dueDay >= 1 &&
    dueDay <= 31
  ) {
    let targetYear = today.year;
    let targetMonth = today.month;

    if (dueDay < today.day) {
      targetMonth += 1;
      if (targetMonth === 13) {
        targetMonth = 1;
        targetYear += 1;
      }
    }

    const targetDay = clampDay(targetYear, targetMonth, dueDay);
    const dueDateIso = isoDate({ year: targetYear, month: targetMonth, day: targetDay });
    const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
    const todayUtc = Date.UTC(today.year, today.month - 1, today.day);

    return {
      statementDate: dueDateIso, // legacy: use dueDate as approximation
      nextDueDate: dueDateIso,
      daysUntilDue: Math.round((targetUtc - todayUtc) / 86_400_000),
    };
  }

  if (
    statementDay == null ||
    !Number.isInteger(statementDay) ||
    statementDay < 1 ||
    statementDay > 31 ||
    paymentDueDaysAfterStatement == null ||
    !Number.isInteger(paymentDueDaysAfterStatement) ||
    paymentDueDaysAfterStatement < 1
  ) {
    return null;
  }

  // ── Statement-cycle algorithm ──
  // Start from the current month and go back to find the most recent statement
  // close date ≤ today. We may need to look back up to 2 months in edge cases.
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);

  // Try current month's statement close date
  let candidateStatementIso = statementCloseDateIso(today.year, today.month, statementDay);

  // If the statement close date for current month is in the future (> today),
  // go back one month
  if (compareIso(candidateStatementIso, todayIso) > 0) {
    const prev = subtractMonths(today.year, today.month, 1);
    candidateStatementIso = statementCloseDateIso(prev.year, prev.month, statementDay);
  }

  // Now we have the most recent statement close date ≤ today.
  // Add grace period to get candidate due date.
  const [sy, sm, sd] = candidateStatementIso.split('-').map(Number);
  const statementParts: CalendarDateParts = { year: sy, month: sm, day: sd };
  const dueParts = addCalendarDays(statementParts, paymentDueDaysAfterStatement);
  const dueDateIso = isoDate(dueParts);
  const dueUtc = Date.UTC(dueParts.year, dueParts.month - 1, dueParts.day);

  if (compareIso(dueDateIso, todayIso) >= 0) {
    // Due date is today or in the future → use it
    return {
      statementDate: candidateStatementIso,
      nextDueDate: dueDateIso,
      daysUntilDue: Math.round((dueUtc - todayUtc) / 86_400_000),
    };
  }

  // Due date already passed → advance to next statement cycle
  // Move the statement close date forward one month from the candidate statement
  const nextStatMonth = sm === 12 ? 1 : sm + 1;
  const nextStatYear = sm === 12 ? sy + 1 : sy;
  const nextStatementIso = statementCloseDateIso(nextStatYear, nextStatMonth, statementDay);

  const [nsy, nsm, nsd] = nextStatementIso.split('-').map(Number);
  const nextStatementParts: CalendarDateParts = { year: nsy, month: nsm, day: nsd };
  const nextDueParts = addCalendarDays(nextStatementParts, paymentDueDaysAfterStatement);
  const nextDueDateIso = isoDate(nextDueParts);
  const nextDueUtc = Date.UTC(nextDueParts.year, nextDueParts.month - 1, nextDueParts.day);

  return {
    statementDate: nextStatementIso,
    nextDueDate: nextDueDateIso,
    daysUntilDue: Math.round((nextDueUtc - todayUtc) / 86_400_000),
  };
}
