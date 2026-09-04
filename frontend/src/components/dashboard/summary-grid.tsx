import { CreditCard, Landmark, WalletCards } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { IDashboardSummary } from '@/shared'
import { clampProgress, formatPercentage, formatVnd } from '@/lib/dashboard-formatters'
import { SummaryCard } from './summary-card'

export function SummaryGrid({ summary }: { summary: IDashboardSummary }) {
  const locale = useLocale()
  const dashboard = useTranslations('dashboard')

  return (
    <section aria-label={dashboard('title')} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        title={dashboard('totalLimit')}
        value={formatVnd(summary.totalCreditLimit, locale)}
        description={dashboard('cardsCount', { count: summary.cardCount })}
        icon={WalletCards}
        warning={summary.hasUnknownLimits ? dashboard('unknownLimits') : undefined}
      />
      <SummaryCard
        title={dashboard('currentDebt')}
        value={formatVnd(summary.totalCurrentBalance, locale)}
        description={dashboard('availableCredit')}
        icon={CreditCard}
      />
      <SummaryCard
        title={dashboard('utilization')}
        value={formatPercentage(summary.utilizationPercent, locale)}
        description={`${dashboard('availableCredit')}: ${formatVnd(summary.availableCredit, locale)}`}
        icon={Landmark}
        progress={clampProgress(summary.utilizationPercent)}
        progressLabel={dashboard('utilization')}
      />
    </section>
  )
}
