import { z } from 'zod'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '@/shared'

// Reusable password schema mirroring backend RegisterDto/ResetPasswordDto rules.
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(PASSWORD_REGEX, 'Password must contain uppercase, lowercase, number and special character')

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Login does not enforce regex — only required (so existing weak passwords still log in).
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(NAME_MIN_LENGTH, `Full name must be at least ${NAME_MIN_LENGTH} characters`)
      .max(NAME_MAX_LENGTH, `Full name must be at most ${NAME_MAX_LENGTH} characters`),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const createReminderSchema = z.object({
  title: z.string().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).optional(),
  amount: z.number().min(0),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
})

export const updateReminderSchema = createReminderSchema.partial()

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type CreateReminderFormData = z.infer<typeof createReminderSchema>
export type UpdateReminderFormData = z.infer<typeof updateReminderSchema>
