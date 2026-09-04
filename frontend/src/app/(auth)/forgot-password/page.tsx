'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthCard } from '@/components/auth/auth-card'
import { IconInput } from '@/components/auth/icon-input'
import { authApi } from '@/lib/auth-api'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'

/**
 * Forgot Password page. Posts the email to the backend which (eventually)
 * sends a reset link. The backend always returns 200 to avoid leaking which
 * emails exist, so the success message is shown unconditionally.
 */
export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null)
    try {
      await authApi.forgotPassword(data.email)
      setSubmittedEmail(data.email)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  if (submittedEmail) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`If an account exists for ${submittedEmail}, we just sent a reset link.`}
      >
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 mt-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Login
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <IconInput
            id="forgot-email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="Enter your email"
            {...register('email')}
          />
          {errors.email ? <p className="text-destructive text-xs">{errors.email.message}</p> : null}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset link'}
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
