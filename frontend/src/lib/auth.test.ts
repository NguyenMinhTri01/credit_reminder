// Capture the NextAuth config by mocking the module before import.
// Use a global to avoid TDZ issues with jest.mock hoisting.
jest.mock('next-auth', () => {
  return {
    __esModule: true,
    default: (config: Record<string, unknown>) => {
      ;(globalThis as Record<string, unknown>).__authConfig = config
      return {
        handlers: { GET: jest.fn(), POST: jest.fn() },
        auth: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
      }
    },
  }
})

jest.mock('next-auth/providers/credentials', () => {
  return (config: Record<string, unknown>) => ({ id: 'credentials', ...config })
})

jest.mock('next-auth/providers/google', () => {
  return (config: Record<string, unknown>) => ({ id: 'google', ...config })
})

import '@/lib/auth'

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

function getConfig(): Record<string, unknown> {
  return (globalThis as Record<string, unknown>).__authConfig as Record<string, unknown>
}

interface AuthConfig {
  session?: { strategy: string }
  pages?: { signIn: string }
  providers: unknown[]
  callbacks?: {
    jwt?: (args: unknown) => unknown
    session?: (args: unknown) => unknown
  }
}

function getAuthConfig(): AuthConfig {
  return (globalThis as Record<string, unknown>).__authConfig as AuthConfig
}

describe('lib/auth', () => {
  beforeAll(() => {
    // Ensure config is captured after module load.
    expect(getConfig()).toBeDefined()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should configure NextAuth with jwt session strategy', () => {
    expect(getAuthConfig().session).toEqual({ strategy: 'jwt' })
  })

  it('should configure /login as the sign-in page', () => {
    expect(getAuthConfig().pages).toEqual({ signIn: '/login' })
  })

  it('should register two providers', () => {
    expect((getAuthConfig().providers as unknown[]).length).toBe(2)
  })

  describe('jwt callback', () => {
    const jwt = () => getAuthConfig().callbacks?.jwt as (args: unknown) => unknown

    it('should persist tokens from Credentials user', async () => {
      const token = {}
      const user = {
        id: '1',
        email: 'a@b.com',
        name: 'A',
        accessToken: 'access-tok',
        refreshToken: 'refresh-tok',
      }

      const result = await jwt()({ token, user, account: null })

      expect(result).toMatchObject({
        accessToken: 'access-tok',
        refreshToken: 'refresh-tok',
        userId: '1',
      })
    })

    it('should exchange Google id_token for backend JWT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '2', email: 'g@b.com', fullName: 'G' },
            tokens: { accessToken: 'g-access', refreshToken: 'g-refresh' },
          }),
      } as Response)

      const token = {}
      const account = { provider: 'google', id_token: 'google-id-token' }

      const result = await jwt()({ token, user: undefined, account })

      expect(mockFetch).toHaveBeenCalled()
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toContain('/auth/google')
      expect(init?.body).toBe(JSON.stringify({ idToken: 'google-id-token' }))
      expect(result).toMatchObject({
        accessToken: 'g-access',
        refreshToken: 'g-refresh',
        userId: '2',
        email: 'g@b.com',
        name: 'G',
      })
    })

    it('should swallow errors when Google token exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) } as Response)

      const token = { existing: 'value' }
      const account = { provider: 'google', id_token: 'bad' }

      const result = await jwt()({ token, user: undefined, account })

      expect(result).toEqual({ existing: 'value' })
    })

    it('should return token unchanged when no user and no google account', async () => {
      const token = { existing: 'value' }
      const result = await jwt()({ token, user: undefined, account: null })
      expect(result).toEqual({ existing: 'value' })
    })

    describe('token refresh', () => {
      /** Build a minimal JWT with the given `exp` (Unix seconds). */
      function makeJwt(exp: number): string {
        const payload = Buffer.from(JSON.stringify({ sub: '1', email: 'a@b.com', exp })).toString(
          'base64url',
        )
        return `header.${payload}.sig`
      }

      it('should not refresh when access token is still valid', async () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        const token = {
          accessToken: makeJwt(futureExp),
          refreshToken: 'ref-tok',
          accessTokenExpiresAt: Date.now() + 3600 * 1000,
        }

        const result = await jwt()({ token, user: undefined, account: null })

        expect(mockFetch).not.toHaveBeenCalled()
        expect(result).toMatchObject({ accessToken: token.accessToken })
      })

      it('should not refresh when accessTokenExpiresAt is 0 (unknown or missing expiry)', async () => {
        const token = {
          accessToken: 'jwt-without-exp',
          refreshToken: 'ref-tok',
          accessTokenExpiresAt: 0,
        }

        const result = await jwt()({ token, user: undefined, account: null })

        expect(mockFetch).not.toHaveBeenCalled()
        expect(result).toMatchObject({ accessToken: token.accessToken })
      })

      it('should call /auth/refresh when token is expired and return new tokens', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
        } as Response)

        const token = {
          accessToken: 'old-access',
          refreshToken: 'old-refresh',
          accessTokenExpiresAt: Date.now() - 1000, // already expired
        }

        const result = await jwt()({ token, user: undefined, account: null })

        const [url, init] = mockFetch.mock.calls[0]
        expect(url).toContain('/auth/refresh')
        expect(init?.body).toBe(JSON.stringify({ refreshToken: 'old-refresh' }))
        expect(result).toMatchObject({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        })
      })

      it('should set error when /auth/refresh returns non-ok', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Expired' }),
        } as Response)

        const token = {
          accessToken: 'old',
          refreshToken: 'old-ref',
          accessTokenExpiresAt: Date.now() - 1000,
        }

        const result = (await jwt()({ token, user: undefined, account: null })) as {
          error?: string
        }
        expect(result.error).toBe('RefreshAccessTokenError')
      })

      it('should set error when there is no refreshToken', async () => {
        const token = {
          accessToken: 'old',
          accessTokenExpiresAt: Date.now() - 1000,
        }

        const result = (await jwt()({ token, user: undefined, account: null })) as {
          error?: string
        }
        expect(result.error).toBe('RefreshAccessTokenError')
        expect(mockFetch).not.toHaveBeenCalled()
      })

      it('should set error when fetch throws', async () => {
        mockFetch.mockRejectedValueOnce(new Error('network failure'))

        const token = {
          accessToken: 'old',
          refreshToken: 'old-ref',
          accessTokenExpiresAt: Date.now() - 1000,
        }

        const result = (await jwt()({ token, user: undefined, account: null })) as {
          error?: string
        }
        expect(result.error).toBe('RefreshAccessTokenError')
      })
    })
  })

  describe('session callback', () => {
    const session = () => getAuthConfig().callbacks?.session as (args: unknown) => unknown

    it('should expose accessToken and userId on session', async () => {
      const result = await session()({
        session: { user: {} },
        token: { accessToken: 'tok', userId: '1' },
      })

      expect(result).toMatchObject({
        accessToken: 'tok',
        user: { id: '1' },
      })
    })

    it('should handle missing user on session', async () => {
      const result = await session()({
        session: {},
        token: { accessToken: 'tok', userId: '1' },
      })

      expect(result).toMatchObject({ accessToken: 'tok' })
    })

    it('should expose error on session when token has error', async () => {
      const result = await session()({
        session: { user: {} },
        token: { accessToken: 'tok', userId: '1', error: 'RefreshAccessTokenError' },
      })

      expect(result).toMatchObject({ error: 'RefreshAccessTokenError' })
    })
  })

  describe('Credentials authorize', () => {
    it('should return null when backend returns non-ok', async () => {
      const credentialsProvider = (getAuthConfig().providers as unknown[])[0] as {
        authorize: (creds: unknown) => Promise<unknown>
      }
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) } as Response)

      const result = await credentialsProvider.authorize({ email: 'a@b.com', password: 'x' })
      expect(result).toBeNull()
    })

    it('should return user with tokens when backend returns ok', async () => {
      const credentialsProvider = (getAuthConfig().providers as unknown[])[0] as {
        authorize: (creds: unknown) => Promise<unknown>
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'a@b.com', fullName: 'A' },
            tokens: { accessToken: 'tok', refreshToken: 'ref' },
          }),
      } as Response)

      const result = await credentialsProvider.authorize({ email: 'a@b.com', password: 'x' })
      expect(result).toMatchObject({
        id: '1',
        email: 'a@b.com',
        name: 'A',
        accessToken: 'tok',
        refreshToken: 'ref',
      })
    })
  })
})
