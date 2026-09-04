import type { IApiResponse, IPaginatedResponse } from '@/shared'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

type RequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /** Optional bearer token; on the server resolved automatically from next-auth session. */
  accessToken?: string
  cache?: RequestCache
}

/**
 * Resolve the access token to attach to a request.
 * - On the server we read it from the next-auth session.
 * - On the client we expect the caller to pass it in (or rely on cookies via a proxy).
 */
async function resolveAccessToken(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit
  if (typeof window !== 'undefined') return undefined
  // Lazy import to keep bundle out of client.
  const { auth } = await import('@/lib/auth')
  const session = await auth()
  return session?.accessToken
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, accessToken, cache } = options

  const token = await resolveAccessToken(accessToken)

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string, opts?: RequestOptions) => request<T>(endpoint, opts),

  post: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'POST', body }),

  patch: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'PATCH', body }),

  put: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'PUT', body }),

  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'DELETE' }),
}

export type { IApiResponse, IPaginatedResponse }
