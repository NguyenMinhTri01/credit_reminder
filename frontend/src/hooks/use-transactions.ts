'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { TRANSACTIONS_PATH, TRANSACTION_PATH } from '@/shared/constants'
import type {
  ITransaction,
  ICreateTransactionPayload,
  IPaginatedResponse,
  IApiResponse,
} from '@/shared'

const CARDS_KEY = ['credit-cards'] as const
const DASHBOARD_KEY = ['dashboard'] as const

export function useTransactionList(cardId: string, page = 1) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: [...CARDS_KEY, cardId, 'transactions', page],
    queryFn: () =>
      apiClient.get<IPaginatedResponse<ITransaction>>(
        `${TRANSACTIONS_PATH(cardId)}?page=${page}&limit=10`,
        { accessToken: session?.accessToken },
      ),
    enabled: !!session?.accessToken && !!cardId,
  })
}

export function useCreateTransaction(cardId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: ICreateTransactionPayload) =>
      apiClient.post<IApiResponse<ITransaction>>(TRANSACTIONS_PATH(cardId), payload, {
        accessToken: session?.accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useUpdateTransaction(cardId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<ICreateTransactionPayload>
    }) =>
      apiClient.patch<IApiResponse<ITransaction>>(TRANSACTION_PATH(cardId, id), payload, {
        accessToken: session?.accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useDeleteTransaction(cardId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<IApiResponse<void>>(TRANSACTION_PATH(cardId, id), {
        accessToken: session?.accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}
