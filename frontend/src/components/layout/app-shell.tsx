'use client'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
