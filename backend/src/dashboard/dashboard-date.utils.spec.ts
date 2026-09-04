import { calculateNextDueDate, DEFAULT_APP_TIME_ZONE, getTodayIso } from './dashboard-date.utils';

describe('dashboard date utilities', () => {
  it('uses the application timezone when resolving today', () => {
    expect(getTodayIso(new Date('2026-09-03T18:00:00.000Z'), DEFAULT_APP_TIME_ZONE)).toBe(
      '2026-09-04',
    );
  });

  it('returns null for a missing or invalid due day', () => {
    const now = new Date('2026-09-04T05:00:00.000Z');
    expect(calculateNextDueDate(null, now)).toBeNull();
    expect(calculateNextDueDate(0, now)).toBeNull();
    expect(calculateNextDueDate(32, now)).toBeNull();
  });

  it('keeps a due day later in the current month', () => {
    expect(calculateNextDueDate(15, new Date('2026-09-04T05:00:00.000Z'))).toEqual({
      nextDueDate: '2026-09-15',
      daysUntilDue: 11,
    });
  });

  it('rolls an elapsed due day into the next month and year', () => {
    expect(calculateNextDueDate(5, new Date('2026-12-20T05:00:00.000Z'))).toEqual({
      nextDueDate: '2027-01-05',
      daysUntilDue: 16,
    });
  });

  it('clamps an unavailable day to the end of February', () => {
    expect(calculateNextDueDate(31, new Date('2027-02-10T05:00:00.000Z'))).toEqual({
      nextDueDate: '2027-02-28',
      daysUntilDue: 18,
    });
  });
});
