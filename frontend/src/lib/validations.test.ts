import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createReminderSchema,
  updateReminderSchema,
} from '@/lib/validations'

describe('lib/validations', () => {
  describe('loginSchema', () => {
    it('should accept valid email and password', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: 'any' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-email', password: 'x' })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    const valid = {
      fullName: 'John Doe',
      email: 'a@b.com',
      password: 'StrongP@ss1',
      confirmPassword: 'StrongP@ss1',
    }

    it('should accept valid input', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject short full name', () => {
      expect(registerSchema.safeParse({ ...valid, fullName: 'J' }).success).toBe(false)
    })

    it('should reject weak password', () => {
      expect(registerSchema.safeParse({ ...valid, password: 'weak', confirmPassword: 'weak' }).success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({ ...valid, confirmPassword: 'OtherP@ss2' })
      expect(result.success).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    const valid = { token: 'tok', newPassword: 'StrongP@ss1', confirmPassword: 'StrongP@ss1' }

    it('should accept valid input', () => {
      expect(resetPasswordSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject empty token', () => {
      expect(resetPasswordSchema.safeParse({ ...valid, token: '' }).success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      expect(resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'OtherP@ss2' }).success).toBe(false)
    })
  })

  describe('createReminderSchema', () => {
    const valid = { title: 'Pay rent', amount: 1000, dueDate: '2026-12-31' }

    it('should accept valid input', () => {
      expect(createReminderSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject short title', () => {
      expect(createReminderSchema.safeParse({ ...valid, title: 'ab' }).success).toBe(false)
    })

    it('should reject negative amount', () => {
      expect(createReminderSchema.safeParse({ ...valid, amount: -1 }).success).toBe(false)
    })

    it('should reject invalid date', () => {
      expect(createReminderSchema.safeParse({ ...valid, dueDate: 'not-a-date' }).success).toBe(false)
    })

    it('should accept optional description', () => {
      expect(createReminderSchema.safeParse({ ...valid, description: 'note' }).success).toBe(true)
    })
  })

  describe('updateReminderSchema', () => {
    it('should accept partial input', () => {
      expect(updateReminderSchema.safeParse({ title: 'New title' }).success).toBe(true)
    })

    it('should accept empty object', () => {
      expect(updateReminderSchema.safeParse({}).success).toBe(true)
    })
  })
})
