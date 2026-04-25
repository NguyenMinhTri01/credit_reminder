import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

/**
 * Backend response shape for /auth/login, /auth/register and /auth/google.
 */
interface BackendAuthResponse {
  user: {
    id: string
    email: string
    fullName: string | null
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

/**
 * Auth.js v5 configuration.
 *
 * Two providers:
 *  1. Credentials  — email/password, calls backend POST /auth/login.
 *  2. Google       — Auth.js handles the OAuth dance and we exchange the
 *                    Google id_token for our backend JWT via POST /auth/google.
 *
 * The backend JWT (access & refresh) is persisted inside the next-auth
 * encrypted session cookie (httpOnly, signed) so the browser never sees it.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        })

        if (!response.ok) return null

        const data = (await response.json()) as BackendAuthResponse
        // Returned object is merged into the JWT in the `jwt` callback.
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.fullName,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    /**
     * Persist backend JWT inside the next-auth session token.
     * - For Credentials: tokens come from the `authorize()` return value.
     * - For Google: exchange Google's id_token with the backend.
     */
    async jwt({ token, user, account }) {
      // First sign-in via Credentials: user object contains backend tokens.
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken as string
        token.refreshToken = user.refreshToken as string
        token.userId = user.id as string
      }

      // First sign-in via Google: exchange id_token for backend JWT.
      if (account?.provider === 'google' && account.id_token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token }),
          })
          if (response.ok) {
            const data = (await response.json()) as BackendAuthResponse
            token.accessToken = data.tokens.accessToken
            token.refreshToken = data.tokens.refreshToken
            token.userId = data.user.id
            token.email = data.user.email
            token.name = data.user.fullName
          }
        } catch {
          // Swallow: invalid token will simply mean session has no accessToken.
        }
      }

      return token
    },
    /**
     * Expose backend access token + user id to the React client via session.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
})
