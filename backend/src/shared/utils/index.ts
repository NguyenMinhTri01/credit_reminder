import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../constants';
import type { IPaginationMeta } from '../types';

/**
 * Normalize pagination params with defaults and bounds.
 */
export function normalizePagination(page?: number, limit?: number) {
  const normalizedPage = Math.max(1, page ?? DEFAULT_PAGE);
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));
  const skip = (normalizedPage - 1) * normalizedLimit;

  return { page: normalizedPage, limit: normalizedLimit, skip };
}

/**
 * Build pagination metadata from query result.
 */
export function buildPaginationMeta(total: number, page: number, limit: number): IPaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Format currency amount to VND or USD.
 */
export function formatCurrency(
  amount: number,
  locale: 'vi-VN' | 'en-US' = 'vi-VN',
  currency: 'VND' | 'USD' = 'VND',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Check if a date is overdue (before today).
 */
export function isOverdue(dueDate: Date | string): boolean {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Safely parse JSON with a fallback.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Remove undefined/null keys from an object (shallow).
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  ) as Partial<T>;
}
