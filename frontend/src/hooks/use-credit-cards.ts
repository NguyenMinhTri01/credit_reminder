'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import {
  CREDIT_CARDS_PATH,
  CREDIT_CARD_PATH,
  CREDIT_CARD_RESTORE_PATH,
  CREDIT_CARD_RECONCILE_PATH,
} from '@/shared/constants'
import type {
  ICreditCard,
  ICreateCreditCardPayload,
  IUpdateCreditCardPayload,
  IReconcilePayload,
} from '@/shared'

interface DeleteResponse {
  message: string
}

const CARDS_KEY = ['credit-cards'] as const
const DASHBOARD_KEY = ['dashboard'] as const

export function useCardList(initialData?: ICreditCard[]) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: [...CARDS_KEY, session?.user?.id],
    queryFn: () =>
      apiClient.get<ICreditCard[]>(CREDIT_CARDS_PATH, {
        accessToken: session?.accessToken,
      }),
    initialData,
    enabled: !!session?.accessToken,
  })
}

export function useCreateCard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (payload: ICreateCreditCardPayload) =>
      apiClient.post<ICreditCard>(CREDIT_CARDS_PATH, payload, {
        accessToken: session?.accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useUpdateCard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IUpdateCreditCardPayload }) =>
      apiClient.patch<ICreditCard>(CREDIT_CARD_PATH(id), payload, {
        accessToken: session?.accessToken,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useDeleteCard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<DeleteResponse>(CREDIT_CARD_PATH(id), {
        accessToken: session?.accessToken,
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, id] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useRestoreCard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ICreditCard>(CREDIT_CARD_RESTORE_PATH(id), {}, {
        accessToken: session?.accessToken,
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, id] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}

export function useReconcileCard() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IReconcilePayload }) =>
      apiClient.post<ICreditCard>(CREDIT_CARD_RECONCILE_PATH(id), payload, {
        accessToken: session?.accessToken,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CARDS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CARDS_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      router.refresh()
    },
  })
}
