'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatVnd, formatCalendarDate } from '@/lib/dashboard-formatters'
import { useDeleteTransaction, useTransactionList } from '@/hooks/use-transactions'
import type { ICreditCard, ITransaction } from '@/shared'

interface TransactionListProps {
  card: ICreditCard
  onEditTransaction?: (transaction: ITransaction) => void
}

function getTypeBadgeVariant(
  type: ITransaction['type'],
): 'destructive' | 'secondary' | 'outline' | 'default' {
  switch (type) {
    case 'EXPENSE':
      return 'destructive'
    case 'PAYMENT':
      return 'secondary'
    case 'REFUND':
      return 'default'
    case 'ADJUSTMENT':
      return 'outline'
  }
}

function getAmountSign(transaction: ITransaction): '-' | '+' {
  if (transaction.type === 'EXPENSE') return '-'
  if (transaction.type === 'ADJUSTMENT' && transaction.amount.startsWith('-')) return '-'
  return '+'
}

function getAbsoluteAmount(amount: string): string {
  return amount.startsWith('-') ? amount.slice(1) : amount
}

export function TransactionList({ card, onEditTransaction }: TransactionListProps) {
  const locale = useLocale()
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const [page, setPage] = useState(1)
  const [deletingTx, setDeletingTx] = useState<ITransaction | null>(null)

  const { data, isLoading, isError } = useTransactionList(card.id, page)
  const deleteMutation = useDeleteTransaction(card.id)

  const transactions = data?.items ?? []
  const meta = data?.meta
  const isPageOutOfRange = meta !== undefined && page > Math.max(1, meta.totalPages)

  useEffect(() => {
    if (meta === undefined) return

    const lastPage = Math.max(1, meta.totalPages)
    if (page > lastPage) {
      // The server is authoritative after a deletion/refetch reduces the page count.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(lastPage)
    }
  }, [meta, page])

  const isImmutable = (tx: ITransaction) => {
    if (tx.type === 'ADJUSTMENT') return true
    if (card.lastReconciledAt && tx.createdAt < card.lastReconciledAt) return true
    return false
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (!deletingTx) return
    try {
      await deleteMutation.mutateAsync(deletingTx.id)
      toast.success(t('deleteSuccess'))
      setDeletingTx(null)
    } catch {
      toast.error(t('errorDeleting'))
    }
  }

  if (isLoading || isPageOutOfRange) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-8 text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>{tCommon('loading')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive rounded-lg border border-dashed p-8 text-center text-sm">
        {t('errorLoading')}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-medium">{t('noTransactions')}</p>
        <p className="text-muted-foreground text-xs">{t('noTransactionsDescription')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead>{t('amount')}</TableHead>
              <TableHead className="w-20 text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const immutable = isImmutable(tx)
              return (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    {formatCalendarDate(tx.transactionDate, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(tx.type)}>{t(`types.${tx.type}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {tx.description || tCommon('noData')}
                      </span>
                      {tx.merchant && (
                        <span className="text-muted-foreground text-xs">{tx.merchant}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap tabular-nums">
                    {getAmountSign(tx)}
                    {formatVnd(getAbsoluteAmount(tx.amount), locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={immutable}
                        title={immutable ? t('preReconciliationError') : tCommon('edit')}
                        onClick={() => onEditTransaction?.(tx)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={immutable}
                        title={immutable ? t('preReconciliationError') : tCommon('delete')}
                        onClick={() => setDeletingTx(tx)}
                      >
                        <Trash2 className="text-destructive h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {t('page')} {meta.page} {t('of')} {meta.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingTx} onOpenChange={(open) => !open && setDeletingTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
