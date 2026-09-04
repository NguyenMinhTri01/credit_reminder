import type { LucideIcon } from 'lucide-react'
import { Bell, CreditCard, History, LayoutDashboard, Settings } from 'lucide-react'

export interface NavigationItem {
  labelKey: 'dashboard' | 'cards' | 'reminders' | 'history' | 'settings'
  icon: LucideIcon
  href?: string
  active?: boolean
}

export const navigationItems: NavigationItem[] = [
  { labelKey: 'dashboard', icon: LayoutDashboard, href: '/home', active: true },
  { labelKey: 'cards', icon: CreditCard },
  { labelKey: 'reminders', icon: Bell },
  { labelKey: 'history', icon: History },
  { labelKey: 'settings', icon: Settings },
]
