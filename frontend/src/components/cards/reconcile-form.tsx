'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatVnd } from '@/lib/dashboard-formatters'
import type { ICreditCard, IReconcilePayload } from '@/shared'
import {
  formatMoneyInputDisplay,
  parseMoneyInputToCanonicalDecimal,
} from '@/lib/money-input.utils'

function buildReconcileSchema(t: ReturnType<typeof useTranslations<'cards'>>) {
  return z.object({
    availableCredit: z
      .string()
      .min(1, t('validationAvailableCreditRequired'))
      .refine((v) => {
        const canonical = parseMoneyInputToCanonicalDecimal(v)
        return canonical !== '' && !canonical.startsWith('-')
      }, t('validationAvailableCreditNonNegative')),
  })
}

interface ReconcileFormProps {
  card: ICreditCard
  onSubmit: (values: IReconcilePayload) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ReconcileForm({
  card,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReconcileFormProps) {
  const locale = useLocale()
  const tCards = useTranslations('cards')
  const tTx = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const schema = buildReconcileSchema(tCards)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IReconcilePayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      availableCredit: card.availableCredit ? formatMoneyInputDisplay(card.availableCredit) : '',
    },
  })

  const onValid = async (data: IReconcilePayload) => {
    await onSubmit({
      availableCredit: parseMoneyInputToCanonicalDecimal(data.availableCredit),
    })
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      <div className="bg-muted/50 rounded-lg border p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Scale className="h-4 w-4 text-primary" />
          <span>{tTx('reconcileTitle')}</span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {tTx('reconcileDescription')}
        </p>
        <div className="mt-3 flex justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">{tCards('availableCreditLabel')}:</span>
          <span className="font-semibold tabular-nums">
            {formatVnd(card.availableCredit, locale)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reconcile-available-credit">{tTx('newAvailableCredit')} (VND)</Label>
        <Controller
          name="availableCredit"
          control={control}
          render={({ field }) => (
            <Input
              id="reconcile-available-credit"
              type="text"
              inputMode="decimal"
              placeholder="0.00đ"
              autoFocus
              value={field.value}
              onChange={(e) => {
                const formatted = formatMoneyInputDisplay(e.target.value)
                field.onChange(formatted)
              }}
            />
          )}
        />
        {errors.availableCredit && (
          <p className="text-destructive text-xs">{errors.availableCredit.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tTx('reconcile')}
        </Button>
      </div>
    </form>
  )
}
