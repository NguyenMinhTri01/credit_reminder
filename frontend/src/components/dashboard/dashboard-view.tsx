import { useTranslations } from 'next-intl'
import type { IDashboardSnapshot } from '@/shared'
import { CreditCardGrid } from './credit-card-grid'
import { SummaryGrid } from './summary-grid'
import { UpcomingReminders } from './upcoming-reminders'

export function DashboardView({ snapshot }: { snapshot: IDashboardSnapshot }) {
  const dashboard = useTranslations('dashboard')

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{dashboard('title')}</h1>
        <p className="text-muted-foreground">{dashboard('description')}</p>
      </header>
      <SummaryGrid summary={snapshot.summary} />
      <CreditCardGrid cards={snapshot.cards} />
      <UpcomingReminders reminders={snapshot.upcomingReminders} />
    </div>
  )
}
