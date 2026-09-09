'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CardForm, parseExpiryRaw } from '@/components/cards/card-form'
import type { CardFormValues } from '@/components/cards/card-form'
import { useUpdateCard } from '@/hooks/use-credit-cards'
import type { ICreditCard, IUpdateCreditCardPayload } from '@/shared'
import { parseMoneyInputToCanonicalDecimal } from '@/lib/money-input.utils'

interface EditCardSheetProps {
  card: ICreditCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCardSheet({ card, open, onOpenChange }: EditCardSheetProps) {
  const t = useTranslations('cards')
  const updateCard = useUpdateCard()

  const handleSubmit = async (data: CardFormValues) => {
    if (updateCard.isPending) return

    try {
      const payload: IUpdateCreditCardPayload = {}
      const expiry = parseExpiryRaw(data.expiryRaw ?? '')

      if (data.bankCode !== card.bankCode) payload.bankCode = data.bankCode
      if (data.cardName !== card.cardName) payload.cardName = data.cardName ?? ''
      if (data.lastFourDigits !== card.lastFourDigits) payload.lastFourDigits = data.lastFourDigits
      const creditLimit = parseMoneyInputToCanonicalDecimal(data.creditLimit)
      // Schema guarantees creditLimit is non-empty when the original had a value,
      // so checking `creditLimit !== card.creditLimit` is safe here.
      if (creditLimit !== card.creditLimit) payload.creditLimit = creditLimit
      if (data.statementDay !== undefined && data.statementDay !== card.statementDay) {
        payload.statementDay = data.statementDay
      }
      if (
        data.paymentDueDaysAfterStatement !== undefined &&
        data.paymentDueDaysAfterStatement !== card.paymentDueDaysAfterStatement
      ) {
        payload.paymentDueDaysAfterStatement = data.paymentDueDaysAfterStatement
      }
      if (expiry.expiryMonth !== undefined && expiry.expiryMonth !== card.expiryMonth) {
        payload.expiryMonth = expiry.expiryMonth
      }
      if (expiry.expiryYear !== undefined && expiry.expiryYear !== card.expiryYear) {
        payload.expiryYear = expiry.expiryYear
      }

      await updateCard.mutateAsync({
        id: card.id,
        payload,
      })
      toast.success(t('updateSuccess'))
      onOpenChange(false)
    } catch {
      toast.error(t('errorUpdating'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('editCard')}</SheetTitle>
          <SheetDescription>
            {card.bankName} — {card.cardName}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CardForm
            defaultValues={{
              bankCode: card.bankCode ?? '',
              cardName: card.cardName,
              lastFourDigits: card.lastFourDigits ?? '',
              creditLimit: card.creditLimit ?? '',
              availableCredit: card.availableCredit ?? '',
              statementDay: card.statementDay ?? undefined,
              paymentDueDaysAfterStatement: card.paymentDueDaysAfterStatement ?? undefined,
              expiryMonth: card.expiryMonth ?? undefined,
              expiryYear: card.expiryYear ?? undefined,
            }}
            onSubmit={handleSubmit}
            isLoading={updateCard.isPending}
            isEdit
            submitLabel={t('editCard')}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
