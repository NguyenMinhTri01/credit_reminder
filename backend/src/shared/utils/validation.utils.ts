import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates that a string value, when parsed as a float, is strictly positive (> 0).
 */
export function IsPositiveDecimalString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPositiveDecimalString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        },
      },
    });
  };
}

/**
 * Validates a non-negative decimal string that PostgreSQL DECIMAL(15, 2) can store.
 * Leading zeroes do not consume integer precision because they do not change the value.
 */
export function IsDecimal15_2String(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isDecimal15_2String',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value)) return false;

          const [rawInteger, fraction = ''] = value.split('.');
          const integer = rawInteger.replace(/^0+/, '') || '0';
          return integer.length <= 13 && fraction.length <= 2;
        },
      },
    });
  };
}

/** Validates a YYYY-MM-DD string as an actual Gregorian calendar date. */
export function IsCalendarDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isCalendarDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

          const [year, month, day] = value.split('-').map(Number);
          const date = new Date(Date.UTC(year, month - 1, day));
          return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
          );
        },
      },
    });
  };
}

/**
 * Validates an expiry year against the current application year at request time.
 * Upper bound is enforced separately by `@Max(MAX_EXPIRY_YEAR)` so each bound
 * reports its own message instead of duplicating this validator's failure.
 */
export function IsCurrentOrFutureYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isCurrentOrFutureYear',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= new Date().getFullYear()
          );
        },
      },
    });
  };
}
