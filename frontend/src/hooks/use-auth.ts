'use client'

import { signOut as nextSignOut, useSession } from 'next-auth/react'

/**
 * Convenience hook around next-auth `useSession()` that exposes:
 *  - `user`      — the authenticated user (or undefined)
 *  - `isLoading` — true while next-auth resolves the session
 *  - `isAuth`    — boolean shortcut
 *  - `signOut()` — clears the session cookie and redirects to `/login`
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    accessToken: session?.accessToken,
    isLoading: status === 'loading',
    isAuth: status === 'authenticated',
    signOut: () => nextSignOut({ callbackUrl: '/login' }),
  }
}
