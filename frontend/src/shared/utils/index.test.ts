import {
  normalizePagination,
  buildPaginationMeta,
  formatCurrency,
  isOverdue,
  safeJsonParse,
  cleanObject,
} from '@/shared/utils'

describe('shared/utils', () => {
  describe('normalizePagination', () => {
    it('should use defaults when params are undefined', () => {
      expect(normalizePagination()).toEqual({ page: 1, limit: 10, skip: 0 })
    })

    it('should clamp page below 1 to 1', () => {
      expect(normalizePagination(0, 5)).toEqual({ page: 1, limit: 5, skip: 0 })
    })

    it('should clamp limit below 1 to 1', () => {
      expect(normalizePagination(2, 0)).toEqual({ page: 2, limit: 1, skip: 1 })
    })

    it('should clamp limit above MAX_LIMIT to MAX_LIMIT', () => {
      expect(normalizePagination(1, 999)).toEqual({ page: 1, limit: 100, skip: 0 })
    })

    it('should compute skip as (page - 1) * limit', () => {
      expect(normalizePagination(3, 20)).toEqual({ page: 3, limit: 20, skip: 40 })
    })
  })

  describe('buildPaginationMeta', () => {
    it('should build metadata with totalPages rounded up', () => {
      expect(buildPaginationMeta(25, 2, 10)).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      })
    })

    it('should return 0 totalPages when total is 0', () => {
      expect(buildPaginationMeta(0, 1, 10).totalPages).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format VND by default', () => {
      expect(formatCurrency(1000000)).toContain('1.000.000')
    })

    it('should format USD when requested', () => {
      const result = formatCurrency(1000, 'en-US', 'USD')
      expect(result).toContain('1,000.00')
    })
  })

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      expect(isOverdue(new Date('2020-01-01'))).toBe(true)
    })

    it('should return false for future dates', () => {
      expect(isOverdue(new Date('2099-01-01'))).toBe(false)
    })

    it('should accept string dates', () => {
      expect(isOverdue('2020-01-01')).toBe(true)
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 })
    })

    it('should return fallback on invalid JSON', () => {
      expect(safeJsonParse('not-json', 'fallback')).toBe('fallback')
    })
  })

  describe('cleanObject', () => {
    it('should remove undefined and null keys', () => {
      expect(cleanObject({ a: 1, b: undefined, c: null, d: 'x' })).toEqual({ a: 1, d: 'x' })
    })

    it('should keep falsy but defined values', () => {
      expect(cleanObject({ a: 0, b: '', c: false })).toEqual({ a: 0, b: '', c: false })
    })
  })
})
