import { renderHook } from '@testing-library/react'
import {
  useCardList,
  useCreateCard,
  useUpdateCard,
  useDeleteCard,
  useRestoreCard,
  useReconcileCard,
} from '@/hooks/use-credit-cards'
import {
  CREDIT_CARDS_PATH,
  CREDIT_CARD_PATH,
  CREDIT_CARD_RESTORE_PATH,
  CREDIT_CARD_RECONCILE_PATH,
} from '@/shared/constants'
import type { ICreditCard } from '@/shared'

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

describe('hooks/use-credit-cards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useCardList', () => {
    it('uses the credit-cards key and disables the query without an access token', () => {
      mockUseSession.mockReturnValue({ data: null })
      mockUseQuery.mockReturnValue({})

      renderHook(() => useCardList())

      const options = mockUseQuery.mock.calls[0][0]
      expect(options.queryKey).toEqual(['credit-cards', undefined])
      expect(options.enabled).toBe(false)
    })

    it('enables the query and forwards initialData when a session is present', () => {
      mockUseSession.mockReturnValue({ data: { accessToken: 'token', user: { id: 'user-1' } } })
      mockUseQuery.mockReturnValue({})
      const initialData: ICreditCard[] = []

      renderHook(() => useCardList(initialData))

      const options = mockUseQuery.mock.calls[0][0]
      expect(options.enabled).toBe(true)
      expect(options.queryKey).toEqual(['credit-cards', 'user-1'])
      expect(options.initialData).toBe(initialData)
    })
  })

  describe('useCreateCard', () => {
    it('posts to the credit-cards path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useCreateCard())

      const options = getMutationOptions()
      const payload = {
        bankCode: 'vcb',
        lastFourDigits: '1234',
        creditLimit: '1000000',
        availableCredit: '1000000',
        statementDay: 1,
        paymentDueDaysAfterStatement: 10,
      }
      options.mutationFn(payload)

      expect(mockApiClient.post).toHaveBeenCalledWith(CREDIT_CARDS_PATH, payload, {
        accessToken: 'token',
      })

      options.onSuccess({}, payload)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useUpdateCard', () => {
    it('patches the card-specific path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useUpdateCard())

      const options = getMutationOptions()
      const variables = { id: 'card-1', payload: { cardName: 'Renamed' } }
      options.mutationFn(variables)

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        CREDIT_CARD_PATH('card-1'),
        variables.payload,
        { accessToken: 'token' },
      )

      options.onSuccess({}, variables)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useDeleteCard', () => {
    it('deletes the card-specific path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useDeleteCard())

      const options = getMutationOptions()
      options.mutationFn('card-1')

      expect(mockApiClient.delete).toHaveBeenCalledWith(CREDIT_CARD_PATH('card-1'), {
        accessToken: 'token',
      })

      options.onSuccess({}, 'card-1')

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useRestoreCard', () => {
    it('posts to the restore path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useRestoreCard())

      const options = getMutationOptions()
      options.mutationFn('card-1')

      expect(mockApiClient.post).toHaveBeenCalledWith(CREDIT_CARD_RESTORE_PATH('card-1'), {}, {
        accessToken: 'token',
      })

      options.onSuccess({}, 'card-1')

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('useReconcileCard', () => {
    it('posts to the reconcile path and invalidates cache + refreshes on success', () => {
      const { refresh, invalidateQueries } = setupMutationContext()
      mockUseMutation.mockReturnValue({})

      renderHook(() => useReconcileCard())

      const options = getMutationOptions()
      const variables = { id: 'card-1', payload: { availableCredit: '500000' } }
      options.mutationFn(variables)

      expect(mockApiClient.post).toHaveBeenCalledWith(
        CREDIT_CARD_RECONCILE_PATH('card-1'),
        variables.payload,
        { accessToken: 'token' },
      )

      options.onSuccess({}, variables)

      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['credit-cards', 'card-1'] })
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
      expect(refresh).toHaveBeenCalledTimes(1)
    })
  })
})
