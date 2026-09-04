import { authApi } from '@/lib/auth-api'

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('lib/auth-api', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  function jsonResponse(body: unknown, ok = true): Response {
    return {
      ok,
      json: () => Promise.resolve(body),
    } as Response
  }

  describe('register', () => {
    it('should POST to /auth/register and return parsed body', async () => {
      const payload = { user: { id: '1' }, tokens: { accessToken: 'a', refreshToken: 'r' } }
      mockFetch.mockResolvedValueOnce(jsonResponse(payload))

      const result = await authApi.register({ email: 'a@b.com', password: 'StrongP@ss1', fullName: 'A' })

      expect(result).toEqual(payload)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toContain('/auth/register')
      expect(init?.method).toBe('POST')
      expect(init?.body).toBe(JSON.stringify({ email: 'a@b.com', password: 'StrongP@ss1', fullName: 'A' }))
    })
  })

  describe('login', () => {
    it('should POST to /auth/login', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ user: {}, tokens: {} }))

      await authApi.login({ email: 'a@b.com', password: 'x' })

      expect(mockFetch.mock.calls[0][0]).toContain('/auth/login')
    })
  })

  describe('googleAuth', () => {
    it('should POST idToken to /auth/google', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ user: {}, tokens: {} }))

      await authApi.googleAuth('id-token')

      const [, init] = mockFetch.mock.calls[0]
      expect(init?.body).toBe(JSON.stringify({ idToken: 'id-token' }))
    })
  })

  describe('forgotPassword', () => {
    it('should POST email to /auth/forgot-password', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'ok' }))

      const result = await authApi.forgotPassword('a@b.com')

      expect(result).toEqual({ message: 'ok' })
    })
  })

  describe('resetPassword', () => {
    it('should POST token + newPassword to /auth/reset-password', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'ok' }))

      await authApi.resetPassword({ token: 'tok', newPassword: 'NewP@ss1' })

      const [, init] = mockFetch.mock.calls[0]
      expect(init?.body).toBe(JSON.stringify({ token: 'tok', newPassword: 'NewP@ss1' }))
    })
  })

  describe('error handling', () => {
    it('should throw backend message on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Email already exists' }, false))

      await expect(authApi.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'Email already exists',
      )
    })

    it('should throw fallback status message when no message field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, false))

      await expect(authApi.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'Request failed with status',
      )
    })

    it('should throw "Request timed out" on AbortError', async () => {
      const abortError = new DOMException('aborted', 'AbortError')
      mockFetch.mockRejectedValueOnce(abortError)

      await expect(authApi.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'Request timed out',
      )
    })

    it('should rethrow non-Abort errors', async () => {
      const networkError = new Error('network down')
      mockFetch.mockRejectedValueOnce(networkError)

      await expect(authApi.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
        'network down',
      )
    })
  })
})
