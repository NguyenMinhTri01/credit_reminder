'use client'

import Link from 'next/link'
import { WalletCards } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { navigationItems } from './navigation'

export function AppSidebar() {
  const common = useTranslations('common')
  const navigation = useTranslations('navigation')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={common('appName')}>
              <Link href="/home">
                <WalletCards />
                <span>{common('appName')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label={navigation('main')}>
              <SidebarMenu>
                {navigationItems.map(({ labelKey, icon: Icon, href, active }) => (
                  <SidebarMenuItem key={labelKey}>
                    {href ? (
                      <SidebarMenuButton asChild isActive={active} tooltip={navigation(labelKey)}>
                        <Link href={href} aria-current="page">
                          <Icon />
                          <span>{navigation(labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        disabled
                        aria-disabled="true"
                        tooltip={`${navigation(labelKey)} — ${navigation('comingSoon')}`}
                      >
                        <Icon />
                        <span>{navigation(labelKey)}</span>
                        <span className="sr-only">{navigation('comingSoon')}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail aria-label={navigation('toggleSidebar')} />
    </Sidebar>
  )
}
