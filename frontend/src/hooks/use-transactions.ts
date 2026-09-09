'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import {
  AUTHENTICATION_REQUIRED_ERROR,
  TRANSACTIONS_PATH,
  TRANSACTION_PATH,
} from '@/shared/constants'
import type {
  ITransaction,
  ICreateTransactionPayload,
  IPaginatedResponse,
} from '@/shared'

interface DeleteResponse {
  message: string
}

// Always resolve the session via getSession() rather than reusing the token
// captured by useSession(): the captured token may be stale (e.g. a tab left
// open past the access-token lifetime). getSession() re-runs the jwt callback,
// which refreshes the access token when needed, so mutations always send a
// valid token as long as the refresh token is still good.
function withCurrentAccessToken<T>(
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  return getSession().then((session) => {
    if (!session?.accessToken) {
      throw new Error(AUTHENTICATION_REQUIRED_ERROR)
    }
    return request(session.accessToken)
  })
}

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
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: ICreateTransactionPayload) =>
      withCurrentAccessToken((accessToken) =>
        apiClient.post<ITransaction>(TRANSACTIONS_PATH(cardId), payload, { accessToken }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useUpdateTransaction(cardId: string) {
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
      withCurrentAccessToken((accessToken) =>
        apiClient.patch<ITransaction>(TRANSACTION_PATH(cardId, id), payload, { accessToken }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useDeleteTransaction(cardId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) =>
      withCurrentAccessToken((accessToken) =>
        apiClient.delete<DeleteResponse>(TRANSACTION_PATH(cardId, id), { accessToken }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, cardId] })
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}
