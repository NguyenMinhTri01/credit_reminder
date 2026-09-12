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
import { CardTypeLogo } from '@/components/cards/card-type-logo'
import { useBankCatalog } from '@/hooks/use-bank-catalog'
import { useCardScheduleConfig } from '@/hooks/use-card-schedule-config'
import {
  LAST_FOUR_DIGITS_LENGTH,
  STATEMENT_DAY_MIN,
  STATEMENT_DAY_MAX,
  PAYMENT_DUE_DAYS_MIN,
  CREDIT_LIMIT_MIN,
  APP_TIMEZONE,
  CARD_TYPE_OPTIONS,
  isCardType,
} from '@/shared/constants'
import type { CardType, IUpdateCreditCardPayload } from '@/shared'
import { formatCalendarDate } from '@/lib/dashboard-formatters'
import { formatMoneyInputDisplay, parseMoneyInputToCanonicalDecimal } from '@/lib/money-input.utils'

// ─── Zod schema ──────────────────────────────────────────────

interface OriginalCardValues {
  cardType?: CardType | null
  creditLimit?: string | null
  statementDay?: number | null
  paymentDueDaysAfterStatement?: number | null
}

function buildCardSchema(
  t: ReturnType<typeof useTranslations<'cards'>>,
  isEdit: boolean,
  original: OriginalCardValues = {},
) {
  /**
   * Determines whether a field that was populated in the original card may be
   * cleared by the user.  Clearing is only allowed when the original value was
   * already absent (legacy-null), so that a real value cannot be silently
   * dropped via a no-op save.
   */
  const hadCreditLimit = Boolean(original.creditLimit && original.creditLimit.trim() !== '')
  const hadStatementDay = original.statementDay != null
  const hadPaymentDueDays = original.paymentDueDaysAfterStatement != null
  const hadCardType = original.cardType != null

  const creditLimitSchema = z.string().refine(
    (value) => {
      if (isEdit && value.trim() === '') {
        // Reject clearing a field that previously held a real value
        return !hadCreditLimit
      }
      const canonical = parseMoneyInputToCanonicalDecimal(value)
      if (!canonical) return false
      const num = Number(canonical)
      return !isNaN(num) && num >= CREDIT_LIMIT_MIN
    },
    t('validationCreditLimitPositive'),
  )

  const optionalScheduleNumber = (
    message: string,
    min: number,
    wasPopulated: boolean,
    max?: number,
  ) => {
    const base = z
      .number({ message })
      .int()
      .min(min, message)
      .pipe(max === undefined ? z.number() : z.number().max(max, message))
      .optional()

    if (!wasPopulated) return base

    // Field had a real value — undefined (cleared) must be rejected
    return z
      .number({ message })
      .int()
      .min(min, message)
      .pipe(max === undefined ? z.number() : z.number().max(max, message))
  }

  const cardTypeSchema = z.string().superRefine((value, context) => {
    if (value.trim() === '') {
      if (!isEdit || hadCardType) {
        context.addIssue({ code: 'custom', message: t('validationCardTypeRequired') })
      }
      return
    }

    if (!isCardType(value)) {
      context.addIssue({ code: 'custom', message: t('validationCardTypeInvalid') })
    }
  })

  return z.object({
    bankCode: z.string().min(1, t('validationBankRequired')),
    cardType: cardTypeSchema,
    cardName: z.string().optional(),
    lastFourDigits: z
      .string()
      .length(LAST_FOUR_DIGITS_LENGTH, t('validationLastFourFormat'))
      .regex(/^\d{4}$/, t('validationLastFourFormat')),
    creditLimit: isEdit
      ? creditLimitSchema
      : creditLimitSchema.min(1, t('validationCreditLimitRequired')),
    availableCredit: isEdit
      ? z.string()
      : z
          .string()
          .min(1, t('validationAvailableCreditRequired'))
          .refine((v) => {
            const canonical = parseMoneyInputToCanonicalDecimal(v)
            return canonical !== ''
          }, t('validationAvailableCreditRequired')),
    statementDay: isEdit
      ? optionalScheduleNumber(
          t('validationStatementDayRequired'),
          STATEMENT_DAY_MIN,
          hadStatementDay,
          STATEMENT_DAY_MAX,
        )
      : z
          .number({ message: t('validationStatementDayRequired') })
          .int()
          .min(STATEMENT_DAY_MIN, t('validationStatementDayRange'))
          .max(STATEMENT_DAY_MAX, t('validationStatementDayRange')),
    paymentDueDaysAfterStatement: isEdit
      ? optionalScheduleNumber(
          t('validationPaymentDueDaysRequired'),
          PAYMENT_DUE_DAYS_MIN,
          hadPaymentDueDays,
        )
      : z
          .number({ message: t('validationPaymentDueDaysRequired') })
          .int()
          .min(PAYMENT_DUE_DAYS_MIN, t('validationPaymentDueDaysPositive')),
    expiryRaw: z
      .string()
      .optional()
      .refine(
        (v) => {
          if (!v || v.trim() === '') return true
          if (!EXPIRY_REGEX.test(v) || isEdit) return EXPIRY_REGEX.test(v)

          return 2000 + Number(v.slice(-2)) >= new Date().getFullYear()
        },
        { message: isEdit ? t('validationExpiryFormat') : t('validationExpiryYearMin') },
      ),
  })
}

type CardFormValues = {
  bankCode: string
  cardType: string
  cardName?: string
  lastFourDigits: string
  creditLimit: string
  availableCredit: string
  statementDay: number | undefined
  paymentDueDaysAfterStatement: number | undefined
  expiryRaw?: string
}

const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/

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
  if (!raw || !EXPIRY_REGEX.test(raw)) return {}
  const [mm, yy] = raw.split('/')
  const month = parseInt(mm, 10)
  const year = 2000 + parseInt(yy, 10)
  return { expiryMonth: month, expiryYear: year }
}

// ─── Next due date preview ────────────────────────────────────

/**
 * Returns the next payment due date as `YYYY-MM-DD` in the application time
 * zone. Calendar-day extraction and arithmetic are explicit so the result is
 * identical regardless of the host OS time zone.
 *
 * @param statementDay - Day-of-month when the credit-card statement is cut.
 * @param graceDays    - Days after the statement date until payment is due.
 * @param now          - Reference instant (default: current wall-clock time).
 *                       Pass a fixed value in tests to keep results stable.
 * @param timezone     - IANA time zone (default: `APP_TIMEZONE`).
 */
function computeNextDue(
  statementDay: number,
  graceDays: number,
  now: Date = new Date(),
  timezone: string = APP_TIMEZONE,
): string | null {
  if (!statementDay || !graceDays) return null

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = fmt.formatToParts(now)
  const get = (type: string): number =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)

  const todayYear = get('year')
  const todayMonth = get('month') // 1-indexed
  const todayDay = get('day')

  const statementDate = (year: number, month: number): Date => {
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return new Date(Date.UTC(year, month - 1, Math.min(statementDay, lastDay)))
  }

  let statement = statementDate(todayYear, todayMonth)
  const todayMs = Date.UTC(todayYear, todayMonth - 1, todayDay)
  if (statement.getTime() > todayMs) {
    const previousMonth = todayMonth === 1 ? 12 : todayMonth - 1
    const previousYear = todayMonth === 1 ? todayYear - 1 : todayYear
    statement = statementDate(previousYear, previousMonth)
  }

  let due = new Date(statement.getTime() + graceDays * 24 * 60 * 60 * 1000)
  if (due.getTime() < todayMs) {
    const statementMonth = statement.getUTCMonth() + 1
    const nextMonth = statementMonth === 12 ? 1 : statementMonth + 1
    const nextYear = statementMonth === 12 ? statement.getUTCFullYear() + 1 : statement.getUTCFullYear()
    statement = statementDate(nextYear, nextMonth)
    due = new Date(statement.getTime() + graceDays * 24 * 60 * 60 * 1000)
  }
  const y = due.getUTCFullYear()
  const m = String(due.getUTCMonth() + 1).padStart(2, '0')
  const d = String(due.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const { timeZone } = useCardScheduleConfig()

  const schema = useMemo(
    () =>
      buildCardSchema(t, isEdit, {
        creditLimit: defaultValues?.creditLimit,
        cardType: defaultValues?.cardType,
        statementDay: defaultValues?.statementDay,
        paymentDueDaysAfterStatement: defaultValues?.paymentDueDaysAfterStatement,
      }),
    // defaultValues is intentionally excluded: the schema is built once from the
    // initial card snapshot and must not change when the user edits field values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEdit, t],
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankCode: defaultValues?.bankCode ?? '',
      cardType: defaultValues?.cardType ?? '',
      cardName: defaultValues?.cardName ?? '',
      lastFourDigits: defaultValues?.lastFourDigits ?? '',
      creditLimit: defaultValues?.creditLimit
        ? formatMoneyInputDisplay(defaultValues.creditLimit)
        : '',
      availableCredit: defaultValues?.availableCredit
        ? formatMoneyInputDisplay(defaultValues.availableCredit)
        : '',
      statementDay: defaultValues?.statementDay,
      paymentDueDaysAfterStatement: defaultValues?.paymentDueDaysAfterStatement,
      expiryRaw: buildExpiryRaw(defaultValues?.expiryMonth, defaultValues?.expiryYear),
    },
  })

  const statementDay = useWatch({ control, name: 'statementDay' })
  const graceDays = useWatch({ control, name: 'paymentDueDaysAfterStatement' })
  const nextDue = computeNextDue(Number(statementDay), Number(graceDays), new Date(), timeZone)

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
  const selectedCardTypeValue = useWatch({ control, name: 'cardType' })
  const selectedCardType = CARD_TYPE_OPTIONS.find(
    (option) => option.value === selectedCardTypeValue,
  )

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
      <div className="flex flex-col gap-2">
        <Label htmlFor="cardType">{t('formCardType')}</Label>
        <Controller
          name="cardType"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id="cardType" className="w-full">
                <SelectValue placeholder={t('formCardTypePlaceholder')}>
                  {selectedCardType ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <CardTypeLogo cardType={selectedCardType.value} size={20} />
                      <span className="truncate">{t(selectedCardType.labelKey)}</span>
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CARD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <CardTypeLogo cardType={option.value} size={20} />
                      <span>{t(option.labelKey)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.cardType && <p className="text-destructive text-xs">{errors.cardType.message}</p>}
      </div>

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
            {...register('statementDay', {
              setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
            })}
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
            {...register('paymentDueDaysAfterStatement', {
              setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
            })}
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

export { parseExpiryRaw, computeNextDue }
export type { CardFormValues }
