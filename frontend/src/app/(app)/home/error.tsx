'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const dashboard = useTranslations('dashboard')

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1 p-4 md:p-6 lg:p-8">
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>{dashboard('loadErrorTitle')}</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col items-start gap-4">
            <p>{dashboard('loadErrorDescription')}</p>
            <Button variant="outline" onClick={reset}>
              {dashboard('retry')}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
