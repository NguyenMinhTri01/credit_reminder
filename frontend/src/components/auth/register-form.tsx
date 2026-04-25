'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconInput } from '@/components/auth/icon-input'
import { PasswordInput } from '@/components/auth/password-input'
import { authApi } from '@/lib/auth-api'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

/**
 * Register form. Calls backend `POST /auth/register` directly to create the
 * account, then immediately signs the user in via next-auth Credentials so
 * the session cookie is established without an extra "please log in" step.
 */
export function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      })
      // Auto sign-in to create the session cookie.
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        setServerError('Account created but auto sign-in failed. Please log in.')
        return
      }
      router.push('/home')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="register-fullname">Full name</Label>
        <IconInput
          id="register-fullname"
          icon={User}
          autoComplete="name"
          placeholder="Enter your full name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'register-fullname-error' : undefined}
          {...register('fullName')}
        />
        {errors.fullName ? (
          <p id="register-fullname-error" className="text-destructive text-xs">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <IconInput
          id="register-email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="Enter your email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id="register-email-error" className="text-destructive text-xs">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'register-password-error' : undefined}
          {...register('password')}
        />
        {errors.password ? (
          <p id="register-password-error" className="text-destructive text-xs">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm">Confirm password</Label>
        <PasswordInput
          id="register-confirm"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p id="register-confirm-error" className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Register'}
      </Button>
    </form>
  )
}
