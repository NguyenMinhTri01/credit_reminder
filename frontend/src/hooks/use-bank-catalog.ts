'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { BANK_CATALOG_PATH } from '@/shared/constants'
import type { IBankCatalogEntry } from '@/shared'

export function useBankCatalog() {
  const { data: session } = useSession()

  const query = useQuery({
    queryKey: ['bank-catalog'],
    queryFn: () =>
      apiClient.get<IBankCatalogEntry[]>(BANK_CATALOG_PATH, {
        accessToken: session?.accessToken,
      }),
    staleTime: Infinity,
    enabled: !!session?.accessToken,
  })

  return {
    banks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
