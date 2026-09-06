'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ITransaction, ICreateTransactionPayload } from '@/shared'
import {
  formatMoneyInputDisplay,
  parseMoneyInputToCanonicalDecimal,
} from '@/lib/money-input.utils'

function buildTransactionSchema(t: ReturnType<typeof useTranslations<'transactions'>>) {
  return z.object({
    type: z.enum(['EXPENSE', 'PAYMENT', 'REFUND'], {
      message: t('validationTypeRequired'),
    }),
    amount: z
      .string()
      .min(1, t('validationAmountRequired'))
      .refine((v) => {
        const canonical = parseMoneyInputToCanonicalDecimal(v)
        if (!canonical) return false
        const num = Number(canonical)
        return !isNaN(num) && num > 0
      }, t('validationAmountPositive')),
    transactionDate: z
      .string()
      .min(1, t('validationDateRequired'))
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('validationDateFormat')),
    description: z.string().optional(),
    merchant: z.string().optional(),
  })
}

type TransactionFormValues = {
  type: 'EXPENSE' | 'PAYMENT' | 'REFUND'
  amount: string
  transactionDate: string
  description?: string
  merchant?: string
}

interface TransactionFormProps {
  initialData?: ITransaction | null
  onSubmit: (values: ICreateTransactionPayload) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TransactionFormProps) {
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const schema = buildTransactionSchema(t)

  const todayIso = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (initialData?.type === 'ADJUSTMENT' ? 'EXPENSE' : initialData?.type) ?? 'EXPENSE',
      amount: initialData?.amount ? formatMoneyInputDisplay(initialData.amount) : '',
      transactionDate: initialData?.transactionDate ?? todayIso,
      description: initialData?.description ?? '',
      merchant: initialData?.merchant ?? '',
    },
  })

  const onValid = async (data: TransactionFormValues) => {
    await onSubmit({
      type: data.type,
      amount: parseMoneyInputToCanonicalDecimal(data.amount),
      transactionDate: data.transactionDate,
      description: data.description || undefined,
      merchant: data.merchant || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-type">{t('type')}</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="tx-type">
                <SelectValue placeholder={t('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">
                  {t('types.EXPENSE')} — {t('typeDescriptions.EXPENSE')}
                </SelectItem>
                <SelectItem value="PAYMENT">
                  {t('types.PAYMENT')} — {t('typeDescriptions.PAYMENT')}
                </SelectItem>
                <SelectItem value="REFUND">
                  {t('types.REFUND')} — {t('typeDescriptions.REFUND')}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-amount">{t('amount')} (VND)</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              id="tx-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00đ"
              value={field.value}
              onChange={(e) => {
                const formatted = formatMoneyInputDisplay(e.target.value)
                field.onChange(formatted)
              }}
            />
          )}
        />
        {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-date">{t('date')}</Label>
        <Input id="tx-date" type="date" {...register('transactionDate')} />
        {errors.transactionDate && (
          <p className="text-destructive text-xs">{errors.transactionDate.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-description">{t('description')}</Label>
        <Input
          id="tx-description"
          placeholder={t('descriptionPlaceholder')}
          {...register('description')}
        />
      </div>

      {/* Merchant */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-merchant">{t('merchant')}</Label>
        <Input
          id="tx-merchant"
          placeholder={t('merchantPlaceholder')}
          {...register('merchant')}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? tCommon('save') : tCommon('create')}
        </Button>
      </div>
    </form>
  )
}
