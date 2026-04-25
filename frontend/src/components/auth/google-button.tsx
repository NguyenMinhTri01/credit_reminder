'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

/**
 * "Continue with Google" button.
 * Triggers next-auth's Google OAuth flow; on success, the JWT callback in
 * `lib/auth.ts` exchanges the Google id_token for our backend JWT.
 */
export function GoogleButton({ callbackUrl = '/home' }: { callbackUrl?: string }) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleClick = async () => {
    setError(null)
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
      // signIn redirects on success; reaching this line means it did not redirect.
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-destructive text-center text-xs">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 text-sm font-medium"
        onClick={handleClick}
        disabled={loading}
      >
        <GoogleIcon className="size-5" />
        {loading ? 'Signing in…' : 'Login with Google'}
      </Button>
    </div>
  )
}

// Inline Google "G" logo to avoid an extra icon dependency.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.35 11.1H12v3.2h5.35c-.5 2.4-2.55 3.8-5.35 3.8a6.1 6.1 0 1 1 0-12.2c1.55 0 2.95.55 4.05 1.45l2.4-2.4A9.4 9.4 0 0 0 12 2.5a9.5 9.5 0 1 0 9.5 9.5c0-.65-.05-1.3-.15-1.9z"
        fill="#4285F4"
      />
      <path
        d="M3.15 7.35l2.65 1.95C6.55 7.5 9.05 5.9 12 5.9c1.55 0 2.95.55 4.05 1.45l2.4-2.4A9.4 9.4 0 0 0 12 2.5 9.5 9.5 0 0 0 3.15 7.35z"
        fill="#EA4335"
      />
      <path
        d="M12 21.5c2.5 0 4.6-.85 6.1-2.3l-2.85-2.3c-.8.55-1.85.9-3.25.9-2.55 0-4.7-1.4-5.45-3.4l-2.7 2.05A9.5 9.5 0 0 0 12 21.5z"
        fill="#34A853"
      />
      <path
        d="M21.35 11.1H12v3.2h5.35c-.25 1.2-.95 2.2-1.95 2.85l2.85 2.3c1.65-1.55 2.7-3.85 2.7-6.45 0-.65-.05-1.3-.15-1.9z"
        fill="#FBBC05"
      />
    </svg>
  )
}
