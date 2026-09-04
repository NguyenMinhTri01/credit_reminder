import { CalendarClock, CreditCard } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { cva } from 'class-variance-authority'
import type { IDashboardCard } from '@/shared'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  clampProgress,
  formatMaskedCard,
  formatPercentage,
  formatVnd,
} from '@/lib/dashboard-formatters'

const accentVariants = cva('h-1 w-full', {
  variants: {
    tone: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      muted: 'bg-muted-foreground',
    },
  },
  defaultVariants: { tone: 'primary' },
})

interface CreditCardTileProps {
  card: IDashboardCard
  tone?: 'primary' | 'secondary' | 'muted'
}

export function CreditCardTile({ card, tone }: CreditCardTileProps) {
  const locale = useLocale()
  const dashboard = useTranslations('dashboard')
  const isOverLimit = card.utilizationPercent !== null && card.utilizationPercent > 100
  const dueLabel =
    card.daysUntilDue === null
      ? dashboard('notAvailable')
      : card.daysUntilDue === 0
        ? dashboard('dueToday')
        : dashboard('dueInDays', { count: card.daysUntilDue })

  return (
    <Card className="h-full overflow-hidden" data-slot="credit-card-tile">
      <div className={accentVariants({ tone })} aria-hidden="true" />
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardDescription className="truncate">{card.bankName}</CardDescription>
          <CardTitle className="truncate">{card.cardName}</CardTitle>
        </div>
        <Badge variant="outline" aria-hidden="true">
          <CreditCard />
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm">{dashboard('cardLimitAndUsed')}</p>
            <p className="font-semibold tabular-nums">
              {formatVnd(card.currentBalance, locale)} / {formatVnd(card.creditLimit, locale)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {dashboard('remaining')}: {formatVnd(card.availableCredit, locale)}
              </span>
              <span className="tabular-nums">
                {formatPercentage(card.utilizationPercent, locale)}
              </span>
            </div>
            <Progress
              value={clampProgress(card.utilizationPercent)}
              aria-valuenow={clampProgress(card.utilizationPercent)}
              aria-label={dashboard('utilization')}
            />
            {isOverLimit ? <Badge variant="destructive">{dashboard('overLimit')}</Badge> : null}
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-3 pt-6">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-xs">{dashboard('cardNumber')}</span>
          <span className="truncate font-medium tracking-wider tabular-nums">
            {formatMaskedCard(card.cardNumberMasked)}
          </span>
        </div>
        <Badge variant="secondary">
          <CalendarClock />
          {dueLabel}
        </Badge>
      </CardFooter>
    </Card>
  )
}
