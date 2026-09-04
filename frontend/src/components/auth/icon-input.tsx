'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Text input with a leading icon (e.g. user, mail) — matches the design spec
 * used across Login / Register / Forgot Password forms.
 */
type IconInputProps = React.ComponentProps<'input'> & {
  icon: LucideIcon
}

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, icon: Icon, ...props }, ref) => (
    <div className="relative">
      <Icon
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        ref={ref}
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:ring-ring bg-transparent',
          'flex h-10 w-full rounded-md border px-9 py-2 text-sm shadow-sm transition-colors',
          'focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  ),
)
IconInput.displayName = 'IconInput'
