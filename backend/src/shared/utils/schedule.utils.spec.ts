import { calculateNextPaymentDue } from './schedule.utils';

const TZ = 'Asia/Ho_Chi_Minh';

// Helper: create a UTC Date that corresponds to a local date string in Asia/Ho_Chi_Minh
// For simplicity we anchor at midnight HCM time = UTC−7
function hcmDate(isoDate: string): Date {
  // 2026-09-05 HCM = 2026-09-04T17:00:00Z
  return new Date(`${isoDate}T00:00:00+07:00`);
}

describe('calculateNextPaymentDue', () => {
  describe('statement-cycle algorithm', () => {
    it('prior-month cycle: 2026-09-05, SD=20, grace=20 → due 2026-09-09, 4 days', () => {
      const now = hcmDate('2026-09-05');
      const result = calculateNextPaymentDue(20, 20, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.statementDate).toBe('2026-08-20');
      expect(result!.nextDueDate).toBe('2026-09-09');
      expect(result!.daysUntilDue).toBe(4);
    });

    it('past due advances cycle: 2026-09-15, SD=20, grace=20 → due 2026-10-10, 25 days', () => {
      const now = hcmDate('2026-09-15');
      const result = calculateNextPaymentDue(20, 20, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.statementDate).toBe('2026-09-20');
      expect(result!.nextDueDate).toBe('2026-10-10');
      expect(result!.daysUntilDue).toBe(25);
    });

    it('daysUntilDue = 0 when due date is today', () => {
      // SD=20, grace=5: statement 2026-08-20, due 2026-08-25
      const now = hcmDate('2026-08-25');
      const result = calculateNextPaymentDue(20, 5, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.nextDueDate).toBe('2026-08-25');
      expect(result!.daysUntilDue).toBe(0);
    });

    it('year boundary: 2026-12-28, SD=15, grace=25 → due 2027-01-09', () => {
      const now = hcmDate('2026-12-28');
      const result = calculateNextPaymentDue(15, 25, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.statementDate).toBe('2026-12-15');
      expect(result!.nextDueDate).toBe('2027-01-09');
    });

    it('statementDay=31 in February clamps to Feb 28', () => {
      // 2026-03-01, SD=31, grace=5: statement close = 2026-02-28, due = 2026-03-05
      const now = hcmDate('2026-03-01');
      const result = calculateNextPaymentDue(31, 5, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.statementDate).toBe('2026-02-28');
    });

    it('statementDay=31 in February 2028 (leap year) clamps to Feb 29', () => {
      // 2028-03-01, SD=31, grace=5: statement close = 2028-02-29
      const now = hcmDate('2028-03-01');
      const result = calculateNextPaymentDue(31, 5, null, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.statementDate).toBe('2028-02-29');
    });
  });

  describe('legacy dueDay fallback', () => {
    it('uses dueDay as fixed day when paymentDueDaysAfterStatement is null', () => {
      // dueDay=15, today=2026-09-05 → next due = 2026-09-15
      const now = hcmDate('2026-09-05');
      const result = calculateNextPaymentDue(null, null, 15, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.nextDueDate).toBe('2026-09-15');
      expect(result!.daysUntilDue).toBe(10);
    });

    it('advances to next month when dueDay has passed', () => {
      const now = hcmDate('2026-09-20');
      const result = calculateNextPaymentDue(null, null, 15, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.nextDueDate).toBe('2026-10-15');
    });

    it('handles year wrap with dueDay', () => {
      const now = hcmDate('2026-12-25');
      const result = calculateNextPaymentDue(null, null, 10, now, TZ);
      expect(result).not.toBeNull();
      expect(result!.nextDueDate).toBe('2027-01-10');
    });
  });

  describe('null / invalid inputs', () => {
    it('returns null when all inputs are null', () => {
      const result = calculateNextPaymentDue(null, null, null, new Date(), TZ);
      expect(result).toBeNull();
    });

    it('returns null when statementDay is provided but paymentDueDaysAfterStatement is null and no dueDay', () => {
      const result = calculateNextPaymentDue(20, null, null, new Date(), TZ);
      expect(result).toBeNull();
    });

    it('returns null when statementDay is out of range', () => {
      const result = calculateNextPaymentDue(0, 20, null, new Date(), TZ);
      expect(result).toBeNull();
    });

    it('returns null when paymentDueDaysAfterStatement is 0', () => {
      const result = calculateNextPaymentDue(20, 0, null, new Date(), TZ);
      expect(result).toBeNull();
    });
  });
});
