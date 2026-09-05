import 'next-auth'
import 'next-auth/jwt'

/**
 * Extend next-auth types so the backend JWT (access/refresh) is type-safe
 * across the JWT callback, the session callback and `useSession()`.
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    /** Set to 'RefreshAccessTokenError' when the refresh token has expired. */
    error?: string
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    userId?: string
    /** Unix timestamp (ms) when the access token expires. */
    accessTokenExpiresAt?: number
    /** Set to 'RefreshAccessTokenError' when the refresh token has expired. */
    error?: string
  }
}
