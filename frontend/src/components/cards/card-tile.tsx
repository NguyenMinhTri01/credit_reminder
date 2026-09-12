'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarClock, MoreHorizontal, Pencil, Trash2, RotateCcw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BankLogo } from '@/components/cards/bank-logo'
import { EditCardSheet } from '@/components/cards/edit-card-sheet'
import { DeleteCardDialog } from '@/components/cards/delete-card-dialog'
import { useRestoreCard } from '@/hooks/use-credit-cards'
import {
  clampProgress,
  formatMaskedCard,
  formatPercentage,
  formatVnd,
} from '@/lib/dashboard-formatters'
import { delay, type ICreditCard } from '@/shared'

interface CardTileProps {
  card: ICreditCard
  onViewDetail?: (card: ICreditCard) => void
}

function getDueUrgency(daysUntilDue: number | null): 'overdue' | 'urgent' | 'warning' | 'normal' {
  if (daysUntilDue === null) return 'normal'
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= 3) return 'urgent'
  if (daysUntilDue <= 7) return 'warning'
  return 'normal'
}

export function CardTile({ card, onViewDetail }: CardTileProps) {
  const locale = useLocale()
  const t = useTranslations('cards')
  const tCommon = useTranslations('common')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const restoreCard = useRestoreCard()

  const isDeleted = !!card.deletedAt
  const daysUntilDue = card.scheduleInfo.daysUntilDue
  const urgency = getDueUrgency(daysUntilDue)

  const dueLabel =
    daysUntilDue === null
      ? t('notAvailable')
      : daysUntilDue < 0
        ? t('urgency.overdue')
        : daysUntilDue === 0
          ? t('dueToday')
          : t('dueInDays', { count: daysUntilDue })

  const dueBadgeVariant =
    urgency === 'overdue' || urgency === 'urgent'
      ? 'destructive'
      : urgency === 'warning'
        ? 'secondary'
        : 'outline'

  const maskedNumber = card.lastFourDigits
    ? `•••• ${card.lastFourDigits}`
    : formatMaskedCard(card.cardNumberMasked)

  const handleRestore = async () => {
    try {
      await restoreCard.mutateAsync(card.id)
      toast.success(t('restoreSuccess'))
    } catch {
      toast.error(t('errorRestoring'))
    }
  }

  return (
    <>
      <Card
        className={`h-full overflow-hidden ${isDeleted ? 'opacity-60' : ''}`}
        data-slot="card-tile"
      >
        <div className="bg-primary h-1 w-full" aria-hidden="true" />
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BankLogo bankCode={card.bankCode} bankName={card.bankName} size={32} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardDescription className="truncate">{card.bankName}</CardDescription>
              <CardTitle className="truncate text-base">{card.cardName}</CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal />
                <span className="sr-only">{tCommon('actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewDetail && (
                <>
                  <DropdownMenuItem onClick={() => onViewDetail(card)}>
                    <Eye />
                    {t('viewDetail')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil />
                    {t('editCard')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => delay(100, () => setDeleteOpen(true))}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 />
                    {t('deleteCard')}
                  </DropdownMenuItem>
                </>
              )}
              {isDeleted && (
                <DropdownMenuItem onClick={handleRestore} disabled={restoreCard.isPending}>
                  <RotateCcw />
                  {t('restoreCard')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Limit / Available */}
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">
                {t('creditLimitLabel')} / {t('availableCreditLabel')}
              </p>
              <p className="font-semibold tabular-nums">
                {formatVnd(card.creditLimit, locale)} / {formatVnd(card.availableCredit, locale)}
              </p>
            </div>

            {/* Utilization */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{t('utilizationLabel')}</span>
                <span className="tabular-nums">
                  {formatPercentage(card.utilizationPercent, locale)}
                </span>
              </div>
              {card.utilizationPercent !== null && (
                <Progress
                  value={clampProgress(card.utilizationPercent)}
                  aria-valuenow={clampProgress(card.utilizationPercent)}
                  aria-label={t('utilizationLabel')}
                />
              )}
            </div>

            {/* Expiry badges */}
            {card.expiryStatus === 'expired' && <Badge variant="destructive">{t('expired')}</Badge>}
            {card.expiryStatus === 'expiring_soon' && (
              <Badge variant="secondary">{t('expiringSoon')}</Badge>
            )}
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="justify-between gap-3 pt-6">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-muted-foreground text-xs">{t('formLastFourDigits')}</span>
            <span className="truncate font-medium tracking-wider tabular-nums">{maskedNumber}</span>
          </div>
          <Badge variant={dueBadgeVariant}>
            <CalendarClock />
            {dueLabel}
          </Badge>
        </CardFooter>
      </Card>

      {!isDeleted && (
        <>
          <EditCardSheet card={card} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteCardDialog card={card} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
    </>
  )
}
