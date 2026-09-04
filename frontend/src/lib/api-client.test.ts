import { apiClient } from '@/lib/api-client'

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('lib/api-client', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // jsdom always defines window, so resolveAccessToken() returns undefined
    // on the client path — callers must pass accessToken explicitly.
  })

  function jsonResponse(body: unknown, ok = true): Response {
    return {
      ok,
      json: () => Promise.resolve(body),
    } as Response
  }

  it('should GET with Authorization header when token provided', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: 'ok' }))

    const result = await apiClient.get('/test', { accessToken: 'tok' })

    expect(result).toEqual({ data: 'ok' })
    const [, init] = mockFetch.mock.calls[0]
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' })
  })

  it('should POST with body and JSON content type', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ created: true }))

    const result = await apiClient.post('/items', { name: 'x' }, { accessToken: 'tok' })

    expect(result).toEqual({ created: true })
    const [, init] = mockFetch.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ name: 'x' }))
  })

  it('should PATCH with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ patched: true }))

    await apiClient.patch('/items/1', { name: 'y' }, { accessToken: 'tok' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init?.method).toBe('PATCH')
    expect(init?.body).toBe(JSON.stringify({ name: 'y' }))
  })

  it('should PUT with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ put: true }))

    await apiClient.put('/items/1', { name: 'z' }, { accessToken: 'tok' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init?.method).toBe('PUT')
  })

  it('should DELETE without body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deleted: true }))

    await apiClient.delete('/items/1', { accessToken: 'tok' })

    const [, init] = mockFetch.mock.calls[0]
    expect(init?.method).toBe('DELETE')
    expect(init?.body).toBeUndefined()
  })

  it('should throw on non-ok response with backend message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Custom error' }, false))

    await expect(apiClient.get('/fail', { accessToken: 'tok' })).rejects.toThrow('Custom error')
  })

  it('should throw fallback "Network error" when response body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
      status: 500,
    } as Response)

    // .json().catch() returns { message: 'Network error' } → that becomes the error.
    await expect(apiClient.get('/fail', { accessToken: 'tok' })).rejects.toThrow('Network error')
  })

  it('should not attach Authorization when no token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiClient.get('/test')

    const [, init] = mockFetch.mock.calls[0]
    expect(init?.headers).not.toHaveProperty('Authorization')
  })
})
