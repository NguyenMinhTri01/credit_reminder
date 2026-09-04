import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useReminders, useReminder, useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/use-reminders'

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('hooks/use-reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useReminders', () => {
    it('should call GET /reminders with query params', async () => {
      mockApiClient.get.mockResolvedValueOnce({ items: [], meta: { total: 0 } })

      const { result } = renderHook(() => useReminders({ page: 2, limit: 20, search: 'foo' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const endpoint = mockApiClient.get.mock.calls[0][0]
      expect(endpoint).toContain('page=2')
      expect(endpoint).toContain('limit=20')
      expect(endpoint).toContain('search=foo')
    })

    it('should call GET /reminders without query string when no params', async () => {
      mockApiClient.get.mockResolvedValueOnce({ items: [], meta: { total: 0 } })

      const { result } = renderHook(() => useReminders(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockApiClient.get.mock.calls[0][0]).toBe('/reminders')
    })
  })

  describe('useReminder', () => {
    it('should call GET /reminders/:id', async () => {
      mockApiClient.get.mockResolvedValueOnce({ id: '1' })

      const { result } = renderHook(() => useReminder('1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockApiClient.get).toHaveBeenCalledWith('/reminders/1')
    })

    it('should not fetch when id is empty', () => {
      renderHook(() => useReminder(''), { wrapper: createWrapper() })
      expect(mockApiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('useCreateReminder', () => {
    it('should POST to /reminders', async () => {
      mockApiClient.post.mockResolvedValueOnce({ id: '1' })

      const { result } = renderHook(() => useCreateReminder(), { wrapper: createWrapper() })

      result.current.mutate({ title: 'Pay rent', amount: 100, dueDate: '2026-12-31' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockApiClient.post).toHaveBeenCalledWith('/reminders', {
        title: 'Pay rent',
        amount: 100,
        dueDate: '2026-12-31',
      })
    })
  })

  describe('useUpdateReminder', () => {
    it('should PATCH /reminders/:id', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ id: '1' })

      const { result } = renderHook(() => useUpdateReminder(), { wrapper: createWrapper() })

      result.current.mutate({ id: '1', data: { title: 'Updated' } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockApiClient.patch).toHaveBeenCalledWith('/reminders/1', { title: 'Updated' })
    })
  })

  describe('useDeleteReminder', () => {
    it('should DELETE /reminders/:id', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ id: '1' })

      const { result } = renderHook(() => useDeleteReminder(), { wrapper: createWrapper() })

      result.current.mutate('1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockApiClient.delete).toHaveBeenCalledWith('/reminders/1')
    })
  })
})
