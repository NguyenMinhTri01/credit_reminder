'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthCard } from '@/components/auth/auth-card'
import { PasswordInput } from '@/components/auth/password-input'
import { authApi } from '@/lib/auth-api'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'

/**
 * Reset Password page. The reset token comes from the email link as a `?token=` query.
 * On success the user is redirected back to /login with a small flash banner.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: '', confirmPassword: '' },
  })

  // Missing/empty token → render an error state directly.
  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="This password reset link is missing a token or has expired."
      >
        <Link
          href="/forgot-password"
          className="text-primary hover:text-primary/80 mt-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Request a new link
        </Link>
      </AuthCard>
    )
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null)
    try {
      await authApi.resetPassword({ token: data.token, newPassword: data.newPassword })
      router.push('/login?reset=success')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Reset failed')
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Choose a strong new password to regain access to your account."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Hidden token field — picked up by react-hook-form */}
        <input type="hidden" {...register('token')} />

        <div className="space-y-2">
          <Label htmlFor="reset-new-password">New password</Label>
          <PasswordInput
            id="reset-new-password"
            autoComplete="new-password"
            placeholder="Enter a new password"
            {...register('newPassword')}
          />
          {errors.newPassword ? (
            <p className="text-destructive text-xs">{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirm password</Label>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            placeholder="Re-enter the new password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>

        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Login
        </Link>
      </form>
    </AuthCard>
  )
}
