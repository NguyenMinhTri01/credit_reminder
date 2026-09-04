import { CreditCard, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { IDashboardCard } from '@/shared'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { CreditCardTile } from './credit-card-tile'

const tones = ['primary', 'secondary', 'muted'] as const

function ComingSoonButton({ label }: { label: string }) {
  const navigation = useTranslations('navigation')
  return (
    <Button disabled title={navigation('comingSoon')}>
      <Plus data-icon="inline-start" />
      {label}
      <span className="sr-only">— {navigation('comingSoon')}</span>
    </Button>
  )
}

export function CreditCardGrid({ cards }: { cards: IDashboardCard[] }) {
  const dashboard = useTranslations('dashboard')

  return (
    <section aria-labelledby="credit-cards-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="credit-cards-title" className="text-2xl font-semibold tracking-tight">
            {dashboard('yourCards')}
          </h2>
          <p className="text-muted-foreground text-sm">{dashboard('cardsDescription')}</p>
        </div>
        <ComingSoonButton label={dashboard('addCard')} />
      </div>
      {cards.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <CreditCardTile key={card.id} card={card} tone={tones[index % tones.length]} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{dashboard('yourCards')}</CardTitle>
            <CardDescription>{dashboard('cardsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCard />
                </EmptyMedia>
                <EmptyTitle>{dashboard('noCardsTitle')}</EmptyTitle>
                <EmptyDescription>{dashboard('noCardsDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ComingSoonButton label={dashboard('addCard')} />
              </EmptyContent>
            </Empty>
          </CardContent>
          <CardFooter />
        </Card>
      )}
    </section>
  )
}
