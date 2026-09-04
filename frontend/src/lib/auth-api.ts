/**
 * Direct REST calls to the backend auth endpoints.
 *
 * These wrappers are used by:
 *  - the next-auth Credentials provider (login)
 *  - React forms calling register / forgot-password / reset-password directly,
 *    since they don't need to create a session yet.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

const REQUEST_TIMEOUT_MS = 10_000

/**
 * Throws a generic Error with the backend `message` for non-2xx responses.
 * Aborts after `timeoutMs` milliseconds (default 10 s) to avoid hung promises.
 */
async function postJson<T>(path: string, body: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timerId)

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message || `Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
  } catch (err) {
    clearTimeout(timerId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  }
}

export const authApi = {
  register: (input: { email: string; password: string; fullName: string }) =>
    postJson<AuthResponse>('/auth/register', input),

  login: (input: { email: string; password: string }) =>
    postJson<AuthResponse>('/auth/login', input),

  googleAuth: (idToken: string) => postJson<AuthResponse>('/auth/google', { idToken }),

  forgotPassword: (email: string) =>
    postJson<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; newPassword: string }) =>
    postJson<{ message: string }>('/auth/reset-password', input),
}
