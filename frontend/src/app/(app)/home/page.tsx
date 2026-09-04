import { DashboardView } from '@/components/dashboard/dashboard-view'
import { apiClient } from '@/lib/api-client'
import type { IDashboardSnapshot } from '@/shared'

export default async function HomePage() {
  const snapshot = await apiClient.get<IDashboardSnapshot>('/dashboard', { cache: 'no-store' })
  return <DashboardView snapshot={snapshot} />
}
