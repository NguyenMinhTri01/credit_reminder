'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useDeleteCard } from '@/hooks/use-credit-cards'
import type { ICreditCard } from '@/shared'

interface DeleteCardDialogProps {
  card: ICreditCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCardDialog({ card, open, onOpenChange }: DeleteCardDialogProps) {
  const t = useTranslations('cards')
  const tCommon = useTranslations('common')
  const deleteCard = useDeleteCard()

  const handleConfirm = async () => {
    try {
      await deleteCard.mutateAsync(card.id)
      toast.success(t('deleteSuccess'))
      onOpenChange(false)
    } catch {
      toast.error(t('errorDeleting'))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCard.isPending}>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={deleteCard.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCard.isPending && <Loader2 className="animate-spin" />}
            {t('deleteCard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
