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
import type { ICreditCard } from '@/shared'

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

    const expiry = parseExpiryRaw(data.expiryRaw ?? '')

    try {
      await updateCard.mutateAsync({
        id: card.id,
        payload: {
          bankCode: data.bankCode,
          cardName: data.cardName || undefined,
          lastFourDigits: data.lastFourDigits,
          creditLimit: data.creditLimit,
          statementDay: data.statementDay,
          paymentDueDaysAfterStatement: data.paymentDueDaysAfterStatement,
          ...expiry,
        },
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
