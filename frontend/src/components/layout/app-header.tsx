'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AccountMenu } from './account-menu'

export function AppHeader() {
  const dashboard = useTranslations('dashboard')
  const navigation = useTranslations('navigation')
  const descriptionId = React.useId()

  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
      <SidebarTrigger aria-label={navigation('toggleSidebar')} />
      <Separator orientation="vertical" className="h-5" />
      <InputGroup className="max-w-xl">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          disabled
          aria-describedby={descriptionId}
          placeholder={dashboard('searchPlaceholder')}
        />
      </InputGroup>
      <span id={descriptionId} className="sr-only">
        {dashboard('searchUnavailable')}
      </span>
      <div className="ml-auto">
        <AccountMenu />
      </div>
    </header>
  )
}
