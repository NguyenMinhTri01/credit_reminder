'use client'

import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { getUserInitials } from '@/lib/dashboard-formatters'

export function AccountMenu() {
  const dashboard = useTranslations('dashboard')
  const { user, signOut } = useAuth()
  const displayName = user?.name?.trim() || user?.email || dashboard('account')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={dashboard('account')}>
          <Avatar className="size-8">
            <AvatarFallback>{getUserInitials(user?.name, user?.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="max-w-56 truncate">{displayName}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => signOut()}>
            <LogOut />
            {dashboard('signOut')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
