import type { Metadata } from 'next'
import { CardsPageView } from '@/components/cards/cards-page-view'
import { apiClient } from '@/lib/api-client'
import type { ICreditCard } from '@/shared'
import { CREDIT_CARDS_PATH } from '@/shared/constants'

export const metadata: Metadata = {
  title: 'Cards | Credit Reminder',
}

export default async function CardsPage() {
  let cards: ICreditCard[] = []

  try {
    cards = await apiClient.get<ICreditCard[]>(CREDIT_CARDS_PATH, { cache: 'no-store' })
  } catch {
    // Render with empty list on error; client will retry via TanStack Query
  }

  return <CardsPageView initialCards={cards} />
}
