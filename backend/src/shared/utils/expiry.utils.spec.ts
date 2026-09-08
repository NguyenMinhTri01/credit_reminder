import { getExpiryStatus } from './expiry.utils';

const TZ = 'Asia/Ho_Chi_Minh';

function hcmDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}

describe('getExpiryStatus', () => {
  describe('normal warning period', () => {
    it('card 03/2030: valid through 2030-03-31, warning from 2029-12-31', () => {
      const info = getExpiryStatus(3, 2030, hcmDate('2029-11-01'), TZ);
      expect(info).not.toBeNull();
      expect(info!.expiryDate).toBe('2030-03-31');
      expect(info!.warningStartDate).toBe('2029-12-31');
      expect(info!.status).toBe('valid');
    });

    it('card 03/2030: status=expiring_soon on warning start date 2029-12-31', () => {
      const info = getExpiryStatus(3, 2030, hcmDate('2029-12-31'), TZ);
      expect(info!.status).toBe('expiring_soon');
    });

    it('card 03/2030: status=expiring_soon during warning period', () => {
      const info = getExpiryStatus(3, 2030, hcmDate('2030-01-15'), TZ);
      expect(info!.status).toBe('expiring_soon');
    });

    it('card 03/2030: status=expiring_soon on last day of expiry month', () => {
      const info = getExpiryStatus(3, 2030, hcmDate('2030-03-31'), TZ);
      expect(info!.status).toBe('expiring_soon');
    });

    it('card 03/2030: status=expired on 2030-04-01', () => {
      const info = getExpiryStatus(3, 2030, hcmDate('2030-04-01'), TZ);
      expect(info!.status).toBe('expired');
    });
  });

  describe('three-month subtraction edge cases', () => {
    it('card 05/2026: warning from 2026-02-28 (Feb 2026 has 28 days, clamped from 31)', () => {
      const info = getExpiryStatus(5, 2026, hcmDate('2026-01-01'), TZ);
      expect(info!.warningStartDate).toBe('2026-02-28');
    });

    it('card 12/2026: status=expiring_soon on 2026-09-05', () => {
      // expiry 12/2026 → expires 2026-12-31, warning from 2026-09-30
      // 2026-09-05 is before warning start → valid
      const info = getExpiryStatus(12, 2026, hcmDate('2026-09-05'), TZ);
      expect(info!.status).toBe('valid');
    });

    it('card 12/2026: status=expiring_soon on 2026-09-30', () => {
      const info = getExpiryStatus(12, 2026, hcmDate('2026-09-30'), TZ);
      expect(info!.status).toBe('expiring_soon');
    });
  });

  describe('null / missing inputs', () => {
    it('returns null when expiryMonth is null', () => {
      expect(getExpiryStatus(null, 2026, new Date(), TZ)).toBeNull();
    });

    it('returns null when expiryYear is null', () => {
      expect(getExpiryStatus(12, null, new Date(), TZ)).toBeNull();
    });

    it('returns null when both are null', () => {
      expect(getExpiryStatus(null, null, new Date(), TZ)).toBeNull();
    });
  });

  describe('expired cards', () => {
    it('card 01/2020 is expired now', () => {
      const info = getExpiryStatus(1, 2020, hcmDate('2026-09-05'), TZ);
      expect(info!.status).toBe('expired');
    });
  });

  it('compares five-digit expiry years numerically', () => {
    const info = getExpiryStatus(12, 10000, hcmDate('9999-12-31'), TZ);
    expect(info!.status).toBe('valid');
  });
});
