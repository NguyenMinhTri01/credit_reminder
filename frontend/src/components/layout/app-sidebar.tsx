'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={common('appName')}>
              <Link href="/">
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
                {navigationItems.map(({ labelKey, icon: Icon, href }) => {
                  const active =
                    href === '/' ? pathname === '/' : (pathname ?? '').startsWith(href ?? '')

                  return (
                  <SidebarMenuItem key={labelKey}>
                    {href ? (
                      <SidebarMenuButton asChild isActive={active} tooltip={navigation(labelKey)}>
                        <Link href={href} aria-current={active ? 'page' : undefined}>
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
                  )
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail aria-label={navigation('toggleSidebar')} />
    </Sidebar>
  )
}
