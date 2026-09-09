'use client'

import Image from 'next/image'
import { useState } from 'react'

interface BankLogoProps {
  bankCode: string | null
  bankName: string | null
  size?: number
}

export function BankLogo({ bankCode, bankName, size = 32 }: BankLogoProps) {
  const [failedBankCode, setFailedBankCode] = useState<string | null>(null)
  const hasError = failedBankCode === bankCode && bankCode !== null

  const src =
    !hasError && bankCode
      ? `/images/banks/${bankCode.toLowerCase()}.svg`
      : '/images/banks/generic-bank.svg'

  return (
    <Image
      src={src}
      alt={bankName ?? 'Bank logo'}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      onError={() => setFailedBankCode(bankCode)}
      unoptimized
    />
  )
}
