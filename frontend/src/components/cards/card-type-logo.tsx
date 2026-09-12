'use client'

import Image from 'next/image'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getCardTypeOption } from '@/shared/constants'

interface CardTypeLogoProps {
  cardType: string | null | undefined
  size?: number
}

export function CardTypeLogo({ cardType, size = 32 }: CardTypeLogoProps) {
  const t = useTranslations('cards')
  const [failedCardType, setFailedCardType] = useState<string | null>(null)
  const option = getCardTypeOption(cardType)
  const hasImageError = option !== undefined && failedCardType === cardType
  const label = option && !hasImageError ? t(option.labelKey) : t('cardTypeUnavailable')
  const height = Math.max(1, Math.round(size * 0.625))

  if (!option || hasImageError) {
    return (
      <span
        role="img"
        aria-label={label}
        data-fallback="true"
        className="text-muted-foreground flex h-5 w-8 shrink-0 items-center justify-center"
      >
        <CreditCardIcon aria-hidden="true" className="h-4 w-4" />
      </span>
    )
  }

  return (
    <Image
      src={option.logoPath}
      alt={label}
      width={size}
      height={height}
      className="h-5 w-8 shrink-0 object-contain"
      onError={() => setFailedCardType(cardType ?? null)}
    />
  )
}
