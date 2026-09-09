'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'
import { APP_TIMEZONE, CARD_SCHEDULE_CONFIG_PATH } from '@/shared/constants'
import type { ICardScheduleConfig } from '@/shared'

export function useCardScheduleConfig() {
  const { data: session } = useSession()

  const query = useQuery({
    queryKey: ['card-schedule-config'],
    queryFn: () =>
      apiClient.get<ICardScheduleConfig>(CARD_SCHEDULE_CONFIG_PATH, {
        accessToken: session?.accessToken,
      }),
    staleTime: Infinity,
    enabled: !!session?.accessToken,
  })

  return { timeZone: query.data?.timeZone ?? APP_TIMEZONE }
}
