import { useTranslations } from 'next-intl'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default function HomeLoading() {
  const common = useTranslations('common')
  return <DashboardSkeleton label={common('loading')} />
}
