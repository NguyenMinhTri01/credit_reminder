import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Route protection middleware.
 *
 * - Public auth pages (`/login`, `/forgot-password`, `/reset-password`) are
 *   always accessible. If the user already has a session, they get bounced
 *   to `/` so they don't see the login form again.
 * - Every other matched route requires a session; otherwise we redirect to
 *   `/login` with the original `?callbackUrl=` so we can return after sign-in.
 */
const PUBLIC_AUTH_PATHS = ['/login', '/forgot-password', '/reset-password']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = Boolean(req.auth)
  const path = nextUrl.pathname

  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

  if (isPublicAuthPath) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', `${path}${nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

// Match every path except Next.js internals, static files and the auth API route.
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
