import { cookies } from 'next/headers'

import { AppShell } from '@/components/layout/app-shell'
import { SIDEBAR_COOKIE_NAME } from '@/shared/constants'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value
  const defaultOpen = sidebarCookie !== 'false'

  return <AppShell defaultOpen={defaultOpen}>{children}</AppShell>
}
