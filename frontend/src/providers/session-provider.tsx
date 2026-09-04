'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

/**
 * Thin client wrapper around next-auth's SessionProvider so the root layout
 * (a Server Component) can still mount it.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
