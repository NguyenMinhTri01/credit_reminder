'use client'

import { useEffect } from 'react'
import { SessionProvider as NextAuthSessionProvider, signOut, useSession } from 'next-auth/react'

/**
 * Monitors session error state and triggers automatic sign-out / redirect to /login
 * when the refresh token has expired or is invalid.
 */
export function SessionErrorHandler() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/login' })
    }
  }, [session?.error])

  return null
}

/**
 * Thin client wrapper around next-auth's SessionProvider so the root layout
 * (a Server Component) can still mount it, including session error handling.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionErrorHandler />
      {children}
    </NextAuthSessionProvider>
  )
}
