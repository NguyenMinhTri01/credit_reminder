'use client'

import { useMemo } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
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
  SelectLabel,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BankLogo } from '@/components/cards/bank-logo'
import { useBankCatalog } from '@/hooks/use-bank-catalog'
import {
  LAST_FOUR_DIGITS_LENGTH,
  STATEMENT_DAY_MIN,
  STATEMENT_DAY_MAX,
  PAYMENT_DUE_DAYS_MIN,
  CREDIT_LIMIT_MIN,
} from '@/shared/constants'
import type { IUpdateCreditCardPayload } from '@/shared'
import { formatCalendarDate } from '@/lib/dashboard-formatters'
import { formatMoneyInputDisplay, parseMoneyInputToCanonicalDecimal } from '@/lib/money-input.utils'

// ─── Zod schema ──────────────────────────────────────────────

function buildCardSchema(t: ReturnType<typeof useTranslations<'cards'>>, isEdit: boolean) {
  return z.object({
    bankCode: z.string().min(1, t('validationBankRequired')),
    cardName: z.string().optional(),
    lastFourDigits: z
      .string()
      .length(LAST_FOUR_DIGITS_LENGTH, t('validationLastFourFormat'))
      .regex(/^\d{4}$/, t('validationLastFourFormat')),
    creditLimit: z
      .string()
      .min(1, t('validationCreditLimitRequired'))
      .refine((v) => {
        const canonical = parseMoneyInputToCanonicalDecimal(v)
        if (!canonical) return false
        const num = Number(canonical)
        return !isNaN(num) && num >= CREDIT_LIMIT_MIN
      }, t('validationCreditLimitPositive')),
    availableCredit: isEdit
      ? z.string()
      : z
          .string()
          .min(1, t('validationAvailableCreditRequired'))
          .refine((v) => {
            const canonical = parseMoneyInputToCanonicalDecimal(v)
            return canonical !== ''
          }, t('validationAvailableCreditRequired')),
    statementDay: z
      .number({ message: t('validationStatementDayRequired') })
      .int()
      .min(STATEMENT_DAY_MIN, t('validationStatementDayRange'))
      .max(STATEMENT_DAY_MAX, t('validationStatementDayRange')),
    paymentDueDaysAfterStatement: z
      .number({ message: t('validationPaymentDueDaysRequired') })
      .int()
      .min(PAYMENT_DUE_DAYS_MIN, t('validationPaymentDueDaysPositive')),
    expiryRaw: z
      .string()
      .optional()
      .refine(
        (v) => {
          if (!v || v.trim() === '') return true
          return /^\d{2}\/\d{2}$/.test(v)
        },
        { message: t('validationExpiryFormat') },
      ),
  })
}

type CardFormValues = {
  bankCode: string
  cardName?: string
  lastFourDigits: string
  creditLimit: string
  availableCredit: string
  statementDay: number
  paymentDueDaysAfterStatement: number
  expiryRaw?: string
}

// ─── Props ───────────────────────────────────────────────────

interface CardFormProps {
  defaultValues?: IUpdateCreditCardPayload & { availableCredit?: string }
  onSubmit: (data: CardFormValues) => Promise<void>
  isLoading: boolean
  isEdit?: boolean
  submitLabel?: string
}

// ─── Helpers ─────────────────────────────────────────────────

function buildExpiryRaw(month?: number | null, year?: number | null): string {
  if (!month || !year) return ''
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
}

function parseExpiryRaw(raw: string): { expiryMonth?: number; expiryYear?: number } {
  if (!raw || !/^\d{2}\/\d{2}$/.test(raw)) return {}
  const [mm, yy] = raw.split('/')
  const month = parseInt(mm, 10)
  const year = 2000 + parseInt(yy, 10)
  return { expiryMonth: month, expiryYear: year }
}

// ─── Next due date preview ────────────────────────────────────

function computeNextDue(statementDay: number, graceDays: number): string | null {
  if (!statementDay || !graceDays) return null
  const today = new Date()
  let statDate = new Date(today.getFullYear(), today.getMonth(), statementDay)
  if (statDate <= today) {
    statDate = new Date(today.getFullYear(), today.getMonth() + 1, statementDay)
  }
  const due = new Date(statDate)
  due.setDate(due.getDate() + graceDays)
  return due.toISOString().slice(0, 10)
}

// ─── Component ───────────────────────────────────────────────

export function CardForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit = false,
  submitLabel,
}: CardFormProps) {
  const t = useTranslations('cards')
  const { banks, isLoading: banksLoading } = useBankCatalog()

  const schema = useMemo(() => buildCardSchema(t, isEdit), [isEdit, t])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankCode: defaultValues?.bankCode ?? '',
      cardName: defaultValues?.cardName ?? '',
      lastFourDigits: defaultValues?.lastFourDigits ?? '',
      creditLimit: defaultValues?.creditLimit
        ? formatMoneyInputDisplay(defaultValues.creditLimit)
        : '',
      availableCredit: defaultValues?.availableCredit
        ? formatMoneyInputDisplay(defaultValues.availableCredit)
        : '',
      statementDay: defaultValues?.statementDay ?? ('' as unknown as number),
      paymentDueDaysAfterStatement:
        defaultValues?.paymentDueDaysAfterStatement ?? ('' as unknown as number),
      expiryRaw: buildExpiryRaw(defaultValues?.expiryMonth, defaultValues?.expiryYear),
    },
  })

  const statementDay = useWatch({ control, name: 'statementDay' })
  const graceDays = useWatch({ control, name: 'paymentDueDaysAfterStatement' })
  const nextDue = computeNextDue(Number(statementDay), Number(graceDays))

  const handleFormSubmit = async (data: CardFormValues) => {
    await onSubmit({
      ...data,
      creditLimit: parseMoneyInputToCanonicalDecimal(data.creditLimit),
      availableCredit: parseMoneyInputToCanonicalDecimal(data.availableCredit),
    })
  }

  // Group banks by category
  const banksByCategory = useMemo(() => {
    const grouped: Record<string, typeof banks> = {}
    for (const bank of banks) {
      if (!grouped[bank.category]) grouped[bank.category] = []
      grouped[bank.category].push(bank)
    }
    return grouped
  }, [banks])

  const selectedBankCode = useWatch({ control, name: 'bankCode' })
  const selectedBank = banks.find((b) => b.bankCode === selectedBankCode)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* Bank selection */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="bankCode">{t('formBankSelection')}</Label>
        <Controller
          name="bankCode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={banksLoading}>
              <SelectTrigger id="bankCode" className="w-full">
                <SelectValue placeholder={t('formBankPlaceholder')}>
                  {selectedBank ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <BankLogo
                        bankCode={selectedBank.bankCode}
                        bankName={selectedBank.name}
                        size={20}
                      />
                      <span className="truncate">
                        {selectedBank.shortName || selectedBank.name}
                      </span>
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(banksByCategory).map(([category, items]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="text-muted-foreground text-xs">
                      {t(
                        `bankCategories.${category as 'state-owned' | 'private' | 'international' | 'finance-company'}`,
                      )}
                    </SelectLabel>
                    {items.map((bank) => (
                      <SelectItem key={bank.bankCode} value={bank.bankCode} textValue={bank.name}>
                        <div className="flex items-center gap-2">
                          <BankLogo bankCode={bank.bankCode} bankName={bank.name} size={16} />
                          <span>{bank.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.bankCode && <p className="text-destructive text-xs">{errors.bankCode.message}</p>}
      </div>

      {/* Card info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastFourDigits">{t('formLastFourDigits')}</Label>
          <Controller
            name="lastFourDigits"
            control={control}
            render={({ field }) => (
              <Input
                id="lastFourDigits"
                maxLength={4}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder={t('formLastFourDigitsPlaceholder')}
                value={field.value}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                  field.onChange(sanitized)
                }}
              />
            )}
          />
          {errors.lastFourDigits && (
            <p className="text-destructive text-xs">{errors.lastFourDigits.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cardName">{t('formCardName')}</Label>
          <Input
            id="cardName"
            placeholder={t('formCardNamePlaceholder')}
            {...register('cardName')}
          />
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="creditLimit">{t('formCreditLimit')}</Label>
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
              <Input
                id="creditLimit"
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
          {errors.creditLimit && (
            <p className="text-destructive text-xs">{errors.creditLimit.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="availableCredit">{t('formAvailableCredit')}</Label>
          <Controller
            name="availableCredit"
            control={control}
            render={({ field }) => (
              <Input
                id="availableCredit"
                type="text"
                inputMode="decimal"
                placeholder="0.00đ"
                disabled={isEdit}
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
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="statementDay">{t('formStatementDay')}</Label>
          <Input
            id="statementDay"
            type="number"
            min={STATEMENT_DAY_MIN}
            max={STATEMENT_DAY_MAX}
            placeholder={t('formStatementDayPlaceholder')}
            {...register('statementDay', { valueAsNumber: true })}
          />
          {errors.statementDay && (
            <p className="text-destructive text-xs">{errors.statementDay.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentDueDaysAfterStatement">{t('formPaymentDueDays')}</Label>
          <Input
            id="paymentDueDaysAfterStatement"
            type="number"
            min={PAYMENT_DUE_DAYS_MIN}
            placeholder={t('formPaymentDueDaysPlaceholder')}
            {...register('paymentDueDaysAfterStatement', { valueAsNumber: true })}
          />
          {errors.paymentDueDaysAfterStatement && (
            <p className="text-destructive text-xs">
              {errors.paymentDueDaysAfterStatement.message}
            </p>
          )}
        </div>
      </div>

      {/* Next due date preview */}
      {nextDue && (
        <p className="text-muted-foreground text-sm">
          {t('nextDueDate')}:{' '}
          <span className="text-foreground font-medium">{formatCalendarDate(nextDue)}</span>
        </p>
      )}

      {/* Expiry */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="expiryRaw">{t('formExpiryLabel')}</Label>
        <Input
          id="expiryRaw"
          placeholder={t('formExpiryPlaceholder')}
          maxLength={5}
          {...register('expiryRaw')}
        />
        {errors.expiryRaw && <p className="text-destructive text-xs">{errors.expiryRaw.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading && <Loader2 className="animate-spin" />}
        {submitLabel ?? t('addCard')}
      </Button>
    </form>
  )
}

export { parseExpiryRaw }
export type { CardFormValues }
