'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  MONEY_INPUT_MAX_INTEGER_DIGITS,
  caretOffsetForDigitIndex,
  groupMoneyDigits,
  sanitizeMoneyInputDigits,
} from '@/lib/money-input.utils'

const CURRENCY_SUFFIX = 'đ'

interface MoneyInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'type' | 'value'> {
  /** Grouped whole-đồng display value, e.g. `400,000`. */
  value: string
  /** Receives the re-grouped display value after every accepted edit. */
  onValueChange: (value: string) => void
}

function countDigits(text: string): number {
  return (text.match(/\d/g) ?? []).length
}

function isDigit(character: string | undefined): boolean {
  return character !== undefined && character >= '0' && character <= '9'
}

/**
 * Whole-đồng money field that re-groups its value on every keystroke.
 *
 * Formatting works in digit space rather than string space: the caret is remembered as "after the
 * Nth digit" and mapped back to a string offset once the separators have been recomputed, so
 * inserting or removing a comma never drags the caret to the end of the value and never discards
 * what the user typed. The `đ` symbol is rendered beside the field, keeping it out of the value
 * that gets parsed.
 *
 * A minus sign cannot be typed: every form that uses this field rejects negative amounts. A
 * negative amount already stored on a card (an overspent available credit) still hydrates with its
 * sign intact and keeps it until the user edits the field.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  disabled,
  onKeyDown,
  placeholder = '0',
  ...props
}: MoneyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const pendingCaretRef = React.useRef<number | null>(null)

  // Runs before paint so the caret never visibly jumps to the end of the re-grouped value.
  React.useLayoutEffect(() => {
    const caret = pendingCaretRef.current
    pendingCaretRef.current = null
    if (caret === null) return
    inputRef.current?.setSelectionRange(caret, caret)
  })

  const commit = (nextRaw: string, digitsBeforeCaret: number): void => {
    const digits = sanitizeMoneyInputDigits(nextRaw).replace(/^-/, '')
    const isOverWide = countDigits(digits) > MONEY_INPUT_MAX_INTEGER_DIGITS
    const nextValue = isOverWide ? value : groupMoneyDigits(digits)
    const digitIndex = isOverWide
      ? Math.max(0, digitsBeforeCaret - 1)
      : Math.min(digitsBeforeCaret, countDigits(nextValue))
    const caret = caretOffsetForDigitIndex(nextValue, digitIndex)

    if (nextValue === value) {
      // The edit was rejected, so React has no state change to re-render from: roll the discarded
      // characters back off the DOM node directly.
      const element = inputRef.current
      if (element) {
        element.value = nextValue
        element.setSelectionRange(caret, caret)
      }
      return
    }

    pendingCaretRef.current = caret
    onValueChange(nextValue)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = event.target.value
    const caret = event.target.selectionStart ?? raw.length
    commit(raw, countDigits(raw.slice(0, caret)))
  }

  /**
   * Deleting a group separator would be undone by re-grouping, so a Backspace or Delete aimed at
   * one is redirected to the digit behind it.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const element = event.currentTarget
    const caret = element.selectionStart
    if (caret === null || caret !== element.selectionEnd) return

    if (event.key === 'Backspace' && !isDigit(element.value[caret - 1])) {
      let cut = caret - 1
      while (cut > 0 && !isDigit(element.value[cut - 1])) cut -= 1
      if (cut <= 0) return

      const raw = `${element.value.slice(0, cut - 1)}${element.value.slice(caret)}`
      event.preventDefault()
      commit(raw, countDigits(element.value.slice(0, cut - 1)))
      return
    }

    if (event.key === 'Delete' && !isDigit(element.value[caret])) {
      let cut = caret
      while (cut < element.value.length && !isDigit(element.value[cut])) cut += 1
      if (cut >= element.value.length) return

      const raw = `${element.value.slice(0, cut)}${element.value.slice(cut + 1)}`
      event.preventDefault()
      commit(raw, countDigits(element.value.slice(0, caret)))
    }
  }

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        className={cn('pr-7', className)}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <span
        aria-hidden="true"
        className={cn(
          'text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm',
          disabled && 'opacity-50',
        )}
      >
        {CURRENCY_SUFFIX}
      </span>
    </div>
  )
}
