'use client'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface AppShellProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function AppShell({ children, defaultOpen = true }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
