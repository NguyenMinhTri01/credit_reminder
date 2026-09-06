'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { CardTile } from '@/components/cards/card-tile'
import { AddCardSheet } from '@/components/cards/add-card-sheet'
import { CardDetailView } from '@/components/cards/card-detail-view'
import { useCardList } from '@/hooks/use-credit-cards'
import type { ICreditCard } from '@/shared'

interface CardsPageViewProps {
  initialCards: ICreditCard[]
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

export function CardsPageView({ initialCards }: CardsPageViewProps) {
  const t = useTranslations('cards')
  const [addOpen, setAddOpen] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [detailCard, setDetailCard] = useState<ICreditCard | null>(null)

  const { data: cards, isLoading } = useCardList(initialCards)

  const allCards = cards ?? []
  const activeCards = allCards.filter((c) => !c.deletedAt)
  const deletedCards = allCards.filter((c) => !!c.deletedAt)

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus data-icon="inline-start" />
          {t('addCard')}
        </Button>
      </header>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activeCards.length === 0 ? (
        /* Empty state */
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCard />
            </EmptyMedia>
            <EmptyTitle>{t('noCardsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noCardsDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              {t('addCard')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        /* Card grid */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeCards.map((card) => (
            <CardTile key={card.id} card={card} onViewDetail={setDetailCard} />
          ))}
        </div>
      )}

      {/* Toggle deleted section */}
      {deletedCards.length > 0 && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className="text-muted-foreground hover:text-foreground w-fit text-sm underline underline-offset-4 transition-colors"
          >
            {showDeleted ? t('hideDeleted') : t('showDeleted')} ({deletedCards.length})
          </button>
          {showDeleted && (
            <>
              <h2 className="text-lg font-medium">{t('deletedCards')}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {deletedCards.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sheets / Modals */}
      <AddCardSheet open={addOpen} onOpenChange={setAddOpen} />

      {detailCard && (
        <CardDetailView
          card={detailCard}
          open={!!detailCard}
          onOpenChange={(open) => { if (!open) setDetailCard(null) }}
        />
      )}
    </div>
  )
}
