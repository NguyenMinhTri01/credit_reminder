'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarClock, Plus, Scale, ShieldAlert, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { BankLogo } from '@/components/cards/bank-logo'
import { EditCardSheet } from '@/components/cards/edit-card-sheet'
import { TransactionList } from '@/components/cards/transaction-list'
import { TransactionForm } from '@/components/cards/transaction-form'
import { ReconcileForm } from '@/components/cards/reconcile-form'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import { useReconcileCard } from '@/hooks/use-credit-cards'
import {
  clampProgress,
  formatCalendarDate,
  formatPercentage,
  formatVnd,
} from '@/lib/dashboard-formatters'
import type {
  ICreditCard,
  ICreateTransactionPayload,
  IReconcilePayload,
  ITransaction,
} from '@/shared'

interface CardDetailViewProps {
  card: ICreditCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardDetailView({ card, open, onOpenChange }: CardDetailViewProps) {
  const locale = useLocale()
  const tCards = useTranslations('cards')
  const tTx = useTranslations('transactions')
  const tCommon = useTranslations('common')

  const [editCardOpen, setEditCardOpen] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [editingTx, setEditingTx] = useState<ITransaction | null>(null)
  const [showReconcile, setShowReconcile] = useState(false)

  const createTxMutation = useCreateTransaction(card.id)
  const updateTxMutation = useUpdateTransaction(card.id)
  const reconcileMutation = useReconcileCard()

  const daysUntilDue = card.scheduleInfo.daysUntilDue
  const isOverLimit = card.utilizationPercent !== null && card.utilizationPercent > 100

  const handleCreateTx = async (values: ICreateTransactionPayload) => {
    try {
      await createTxMutation.mutateAsync(values)
      toast.success(tTx('createSuccess'))
      setShowAddTx(false)
    } catch {
      toast.error(tTx('errorCreating'))
    }
  }

  const handleUpdateTx = async (values: ICreateTransactionPayload) => {
    if (!editingTx) return
    try {
      await updateTxMutation.mutateAsync({
        id: editingTx.id,
        payload: {
          ...values,
          description: values.description ?? '',
          merchant: values.merchant ?? '',
        },
      })
      toast.success(tTx('updateSuccess'))
      setEditingTx(null)
    } catch {
      toast.error(tTx('errorUpdating'))
    }
  }

  const handleReconcile = async (values: IReconcilePayload) => {
    try {
      await reconcileMutation.mutateAsync({ id: card.id, payload: values })
      toast.success(tTx('reconcileSuccess'))
      setShowReconcile(false)
    } catch {
      toast.error(tTx('reconcileError'))
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-6">
          <SheetHeader className="gap-2 pr-10 sm:pr-12">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <BankLogo bankCode={card.bankCode} bankName={card.bankName} size={40} />
                <div className="flex flex-col min-w-0">
                  <SheetTitle className="text-xl font-bold leading-tight truncate">
                    {card.cardName || card.bankName}
                  </SheetTitle>
                  <SheetDescription className="text-xs truncate">
                    {card.bankName} {card.lastFourDigits && `(•••• ${card.lastFourDigits})`}
                  </SheetDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setEditCardOpen(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {tCommon('edit')}
              </Button>
            </div>
          </SheetHeader>

          {/* Expiry Badge */}
          {card.expiryStatus && card.expiryStatus !== 'valid' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">
                  {card.expiryStatus === 'expiring_soon'
                    ? tCards('expiringSoon')
                    : tCards('expired')}
                  :
                </span>{' '}
                {card.expiryMonth && card.expiryYear
                  ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
                  : ''}
              </div>
            </div>
          )}

          {/* Financial Overview Card */}
          <div className="mt-6 flex flex-col gap-4 rounded-xl border p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{tCards('creditLimitLabel')}</p>
                <p className="text-lg font-bold tabular-nums">
                  {formatVnd(card.creditLimit, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCards('availableCreditLabel')}</p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {formatVnd(card.availableCredit, locale)}
                </p>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="flex flex-col gap-1.5 border-t pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tCards('utilizationLabel')}</span>
                <span className="font-semibold tabular-nums">
                  {formatPercentage(card.utilizationPercent, locale)}
                </span>
              </div>
              {card.utilizationPercent !== null && (
                <Progress
                  value={clampProgress(card.utilizationPercent)}
                  aria-label={tCards('utilizationLabel')}
                />
              )}
              {isOverLimit && (
                <Badge variant="destructive" className="mt-1 w-fit text-xs">
                  {tCards('urgency.overLimit')}
                </Badge>
              )}
            </div>

            {/* Schedule & Due Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {tCards('nextDueDate')}:{' '}
                  <strong className="text-foreground">
                    {card.scheduleInfo.nextDueDate
                      ? formatCalendarDate(card.scheduleInfo.nextDueDate, locale)
                      : tCards('notAvailable')}
                  </strong>
                </span>
              </div>
              {daysUntilDue !== null && (
                <Badge
                  variant={daysUntilDue <= 3 ? 'destructive' : daysUntilDue <= 7 ? 'secondary' : 'outline'}
                >
                  {daysUntilDue === 0 ? tCards('dueToday') : tCards('dueInDays', { count: daysUntilDue })}
                </Badge>
              )}
            </div>

            {/* Reconciliation status */}
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>{tCards('lastReconciledAt')}:</span>
              <span className="font-medium text-foreground">
                {card.lastReconciledAt
                  ? formatCalendarDate(card.lastReconciledAt.slice(0, 10), locale)
                  : tCards('neverReconciled')}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant={showAddTx ? 'secondary' : 'default'}
              size="sm"
              onClick={() => {
                setShowAddTx((v) => !v)
                setShowReconcile(false)
                setEditingTx(null)
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {tTx('addTransaction')}
            </Button>
            <Button
              variant={showReconcile ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setShowReconcile((v) => !v)
                setShowAddTx(false)
                setEditingTx(null)
              }}
            >
              <Scale className="mr-1.5 h-4 w-4" />
              {tTx('reconcile')}
            </Button>
          </div>

          {/* Inline Add Transaction Form */}
          {showAddTx && (
            <div className="mt-4 rounded-xl border p-4 bg-muted/20">
              <h3 className="mb-3 font-semibold text-sm">{tTx('addTransaction')}</h3>
              <TransactionForm
                onSubmit={handleCreateTx}
                onCancel={() => setShowAddTx(false)}
                isSubmitting={createTxMutation.isPending}
              />
            </div>
          )}

          {/* Inline Edit Transaction Form */}
          {editingTx && (
            <div className="mt-4 rounded-xl border p-4 bg-muted/20">
              <h3 className="mb-3 font-semibold text-sm">{tTx('editTransaction')}</h3>
              <TransactionForm
                key={editingTx.id}
                initialData={editingTx}
                onSubmit={handleUpdateTx}
                onCancel={() => setEditingTx(null)}
                isSubmitting={updateTxMutation.isPending}
              />
            </div>
          )}

          {/* Inline Reconcile Form */}
          {showReconcile && (
            <div className="mt-4 rounded-xl border p-4 bg-muted/20">
              <ReconcileForm
                card={card}
                onSubmit={handleReconcile}
                onCancel={() => setShowReconcile(false)}
                isSubmitting={reconcileMutation.isPending}
              />
            </div>
          )}

          <Separator className="my-6" />

          {/* Transactions List */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-base">{tTx('title')}</h3>
            <TransactionList
              card={card}
              onEditTransaction={(tx) => {
                setEditingTx(tx)
                setShowAddTx(false)
                setShowReconcile(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Card Sheet */}
      <EditCardSheet
        card={card}
        open={editCardOpen}
        onOpenChange={setEditCardOpen}
      />
    </>
  )
}
