import { renderHook } from '@testing-library/react'
import {
  useTransactionList,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import {
  AUTHENTICATION_REQUIRED_ERROR,
  TRANSACTIONS_PATH,
  TRANSACTION_PATH,
} from '@/shared/constants'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  getSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const mockUseSession = useSession as jest.Mock
const mockGetSession = getSession as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseQuery = useQuery as jest.Mock
const mockUseMutation = useMutation as jest.Mock
const mockUseQueryClient = useQueryClient as jest.Mock
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

function getMutationOptions() {
  return mockUseMutation.mock.calls[0][0] as {
    mutationFn: (...args: unknown[]) => unknown
    onSuccess: (...args: unknown[]) => void
  }
}

function setupMutationContext() {
  mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
  mockGetSession.mockResolvedValue({ accessToken: 'fresh-token' })
  const refresh = jest.fn()
  const invalidateQueries = jest.fn()
  mockUseRouter.mockReturnValue({ refresh })
  mockUseQueryClient.mockReturnValue({ invalidateQueries })
  return { refresh, invalidateQueries }
}

describe('hooks/use-transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useTransactionList', () => {
    it('builds a key from cardId and page and disables the query without a session', () => {
      mockUseSession.mockReturnValue({ data: null })
      mockUseQuery.mockReturnValue({})

      renderHook(() => useTransactionList('card-1', 2))

      const options = mockUseQuery.mock.calls[0][0]
      expect(options.queryKey).toEqual(['credit-cards', 'card-1', 'transactions', 2])
      expect(options.enabled).toBe(false)
    })

    it('disables the query when cardId is empty', () => {
      mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
      mockUseQuery.mockReturnValue({})

      renderHook(() => useTransactionList('', 1))

      const options = mockUseQuery.mock.calls[0][0]
      expect(options.enabled).toBe(false)
    })

    it('enables the query when both access token and cardId are present', () => {
      mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
      mockUseQuery.mockReturnValue({})

      renderHook(() => useTransactionList('card-1'))

      const options = mockUseQuery.mock.calls[0][0]
      expect(options.queryKey).toEqual(['credit-cards', 'card-1', 'transactions', 1])
      expect(options.enabled).toBe(true)
    })
  })

  describe('useCreateTransaction', () => {
    it('posts to the transactions path and invalidates cache + refreshes on success', async () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateTransaction('card-1'))

      const options = getMutationOptions()
      const payload = {
        type: 'EXPENSE',
        amount: '1000',
        transactionDate: '2026-09-07',
      }
      await options.mutationFn(payload)

      expect(mockApiClient.post).toHaveBeenCalledWith(TRANSACTIONS_PATH('card-1'), payload, {
        accessToken: 'fresh-token',
      })

      options.onSuccess({}, payload)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })

    it('resolves a current session token when the hook rendered before session hydration', async () => {
      mockUseSession.mockReturnValue({ data: undefined })
      mockGetSession.mockResolvedValue({ accessToken: 'fresh-token' })
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateTransaction('card-1'))

      const options = getMutationOptions()
      const payload = {
        type: 'EXPENSE',
        amount: '1000',
        transactionDate: '2026-09-07',
      }

      await options.mutationFn(payload)

      expect(mockApiClient.post).toHaveBeenCalledWith(TRANSACTIONS_PATH('card-1'), payload, {
        accessToken: 'fresh-token',
      })
    })

    it('refreshes a stale access token via getSession instead of reusing the captured one', async () => {
      // Simulates a tab left open past the access-token lifetime: useSession
      // still holds the expired token, but getSession returns a refreshed one.
      mockUseSession.mockReturnValue({ data: { accessToken: 'expired-token' } })
      mockGetSession.mockResolvedValue({ accessToken: 'refreshed-token' })
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateTransaction('card-1'))

      const options = getMutationOptions()
      await options.mutationFn({
        type: 'EXPENSE',
        amount: '1000',
        transactionDate: '2026-09-07',
      })

      expect(mockGetSession).toHaveBeenCalled()
      expect(mockApiClient.post).toHaveBeenCalledWith(
        TRANSACTIONS_PATH('card-1'),
        expect.any(Object),
        { accessToken: 'refreshed-token' },
      )
    })

    it('throws when no session can be resolved', async () => {
      mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
      mockGetSession.mockResolvedValue(null)
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateTransaction('card-1'))

      const options = getMutationOptions()
      await expect(
        options.mutationFn({
          type: 'EXPENSE',
          amount: '1000',
          transactionDate: '2026-09-07',
        }),
      ).rejects.toThrow(AUTHENTICATION_REQUIRED_ERROR)
    })
  })

  describe('useUpdateTransaction', () => {
    it('patches the transaction-specific path and invalidates cache + refreshes on success', async () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useUpdateTransaction('card-1'))

      const options = getMutationOptions()
      const variables = { id: 'tx-1', payload: { amount: '2000' } }
      await options.mutationFn(variables)

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        TRANSACTION_PATH('card-1', 'tx-1'),
        variables.payload,
        { accessToken: 'fresh-token' },
      )

      options.onSuccess({}, variables)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useDeleteTransaction', () => {
    it('deletes the transaction-specific path and invalidates cache + refreshes on success', async () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useDeleteTransaction('card-1'))

      const options = getMutationOptions()
      await options.mutationFn('tx-1')

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        TRANSACTION_PATH('card-1', 'tx-1'),
        { accessToken: 'fresh-token' },
      )

      options.onSuccess({}, 'tx-1')

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })
})
