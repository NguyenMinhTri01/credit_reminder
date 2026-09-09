import type { LucideIcon } from 'lucide-react'
import { Bell, CreditCard, History, LayoutDashboard, Settings } from 'lucide-react'

export interface NavigationItem {
  labelKey: 'dashboard' | 'cards' | 'reminders' | 'history' | 'settings'
  icon: LucideIcon
  href?: string
}

export const navigationItems: NavigationItem[] = [
  { labelKey: 'dashboard', icon: LayoutDashboard, href: '/' },
  { labelKey: 'cards', icon: CreditCard, href: '/cards' },
  { labelKey: 'reminders', icon: Bell },
  { labelKey: 'history', icon: History },
  { labelKey: 'settings', icon: Settings },
]
