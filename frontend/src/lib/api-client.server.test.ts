/** @jest-environment node */

import { apiClient } from './api-client'
import { auth } from './auth'

jest.mock('./auth', () => ({
  auth: jest.fn(),
}))

describe('server API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
    jest.mocked(auth).mockResolvedValue({ accessToken: 'server-token' } as never)
  })

  it('resolves the Auth.js bearer token without exposing it to a component', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ generatedAt: 'now' }),
    } as Response)

    await apiClient.get('/dashboard', { cache: 'no-store' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard'),
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({ Authorization: 'Bearer server-token' }),
      }),
    )
  })
})
