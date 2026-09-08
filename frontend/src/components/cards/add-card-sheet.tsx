'use client'

import { useRef } from 'react'
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
import { useCreateCard } from '@/hooks/use-credit-cards'

interface AddCardSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCardSheet({ open, onOpenChange }: AddCardSheetProps) {
  const t = useTranslations('cards')
  const createCard = useCreateCard()
  const isSubmittingRef = useRef(false)

  const handleSubmit = async (data: CardFormValues) => {
    if (isSubmittingRef.current || createCard.isPending) return
    isSubmittingRef.current = true
    const { expiryRaw, ...rest } = data
    const expiry = parseExpiryRaw(expiryRaw ?? '')

    try {
      await createCard.mutateAsync({
        bankCode: rest.bankCode,
        cardName: rest.cardName || undefined,
        lastFourDigits: rest.lastFourDigits,
        creditLimit: rest.creditLimit,
        availableCredit: rest.availableCredit,
        statementDay: rest.statementDay,
        paymentDueDaysAfterStatement: rest.paymentDueDaysAfterStatement,
        ...expiry,
      })
      toast.success(t('createSuccess'))
      onOpenChange(false)
    } catch {
      toast.error(t('errorCreating'))
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('addCard')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CardForm
            onSubmit={handleSubmit}
            isLoading={createCard.isPending}
            submitLabel={t('addCard')}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
