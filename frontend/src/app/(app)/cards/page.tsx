import type { Metadata } from 'next'
import { CardsPageView } from '@/components/cards/cards-page-view'
import { apiClient } from '@/lib/api-client'
import type { ICreditCard } from '@/shared'
import { CREDIT_CARDS_PATH } from '@/shared/constants'

export const metadata: Metadata = {
  title: 'Cards | Credit Reminder',
}

export default async function CardsPage() {
  const cards = await apiClient.get<ICreditCard[]>(CREDIT_CARDS_PATH, { cache: 'no-store' })

  return <CardsPageView initialCards={cards} />
}
