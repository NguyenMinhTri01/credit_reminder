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
  const width = Math.max(1, size)
  const height = Math.max(1, Math.round(width * 0.625))
  const fallbackIconSize = Math.min(16, height)

  if (!option || hasImageError) {
    return (
      <span
        role="img"
        aria-label={label}
        data-fallback="true"
        className="text-muted-foreground flex shrink-0 items-center justify-center"
        style={{ width, height }}
      >
        <CreditCardIcon aria-hidden="true" size={fallbackIconSize} />
      </span>
    )
  }

  return (
    <Image
      src={option.logoPath}
      alt={label}
      width={width}
      height={height}
      className="shrink-0 object-contain"
      style={{ width, height }}
      onError={() => setFailedCardType(cardType ?? null)}
    />
  )
}
