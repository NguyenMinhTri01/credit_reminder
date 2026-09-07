import { renderHook } from '@testing-library/react'
import {
  useTransactionList,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { TRANSACTIONS_PATH, TRANSACTION_PATH } from '@/shared/constants'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
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

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const mockUseSession = useSession as jest.Mock
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
    it('posts to the transactions path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateTransaction('card-1'))

      const options = getMutationOptions()
      const payload = {
        type: 'EXPENSE',
        amount: '1000',
        transactionDate: '2026-09-07',
      }
      options.mutationFn(payload)

      expect(mockApiClient.post).toHaveBeenCalledWith(TRANSACTIONS_PATH('card-1'), payload, {
        accessToken: 'token',
      })

      options.onSuccess({}, payload)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useUpdateTransaction', () => {
    it('patches the transaction-specific path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useUpdateTransaction('card-1'))

      const options = getMutationOptions()
      const variables = { id: 'tx-1', payload: { amount: '2000' } }
      options.mutationFn(variables)

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        TRANSACTION_PATH('card-1', 'tx-1'),
        variables.payload,
        { accessToken: 'token' },
      )

      options.onSuccess({}, variables)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useDeleteTransaction', () => {
    it('deletes the transaction-specific path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useDeleteTransaction('card-1'))

      const options = getMutationOptions()
      options.mutationFn('tx-1')

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        TRANSACTION_PATH('card-1', 'tx-1'),
        { accessToken: 'token' },
      )

      options.onSuccess({}, 'tx-1')

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })
})
