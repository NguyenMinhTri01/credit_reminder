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

interface InputSelection {
  start: number
  end: number
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
 * A minus sign cannot be typed. A negative amount already stored on a card (an overspent available
 * credit) hydrates with its sign intact; forms can submit it unchanged, while an amount-digit edit
 * removes the sign.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  disabled,
  onKeyDown,
  onBeforeInput,
  onPaste,
  placeholder = '0',
  ...props
}: MoneyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const pendingCaretRef = React.useRef<number | null>(null)
  const pendingSelectionRef = React.useRef<InputSelection | null>(null)

  const readSelection = (element: HTMLInputElement): InputSelection => ({
    start: element.selectionStart ?? element.value.length,
    end: element.selectionEnd ?? element.value.length,
  })

  const rememberSelection = (element: HTMLInputElement): InputSelection => {
    const selection = readSelection(element)
    pendingSelectionRef.current = selection
    return selection
  }

  // Runs before paint so the caret never visibly jumps to the end of the re-grouped value.
  React.useLayoutEffect(() => {
    const caret = pendingCaretRef.current
    pendingCaretRef.current = null
    if (caret === null) return
    inputRef.current?.setSelectionRange(caret, caret)
  })

  const commit = (
    nextRaw: string,
    digitsBeforeCaret: number,
    inputType: string,
    selectionBeforeEdit: InputSelection | null = null,
  ): void => {
    pendingSelectionRef.current = null
    const sanitized = sanitizeMoneyInputDigits(nextRaw)
    const isSignOnlyDelete = inputType.startsWith('delete') && /^-$/.test(nextRaw)
    const isDigitlessReplacement = nextRaw.length > 0 && !/\d/.test(sanitized) && !isSignOnlyDelete
    const candidateDigits = sanitized.replace(/^-/, '')
    const currentDigits = sanitizeMoneyInputDigits(value).replace(/^-/, '')
    const explicitSignDeletion =
      value.startsWith('-') && !nextRaw.includes('-') && inputType.startsWith('delete')
    const fullValuePasteWithoutSign =
      inputType === 'insertFromPaste' &&
      value.startsWith('-') &&
      !nextRaw.includes('-') &&
      selectionBeforeEdit?.start === 0 &&
      selectionBeforeEdit?.end === value.length
    const preserveNegativeSign =
      value.startsWith('-') &&
      candidateDigits === currentDigits &&
      !explicitSignDeletion &&
      !fullValuePasteWithoutSign
    const digits = preserveNegativeSign ? `-${candidateDigits}` : candidateDigits
    const isOverWide = countDigits(digits) > MONEY_INPUT_MAX_INTEGER_DIGITS
    const nextValue = isOverWide || isDigitlessReplacement ? value : groupMoneyDigits(digits)
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
        const selection = selectionBeforeEdit
        if (selection && inputType.startsWith('delete')) {
          // Deleting a selection that contains only a group separator leaves the comma selected,
          // making Delete/Backspace appear ineffective. Collapse the selection for rejected delete
          // edits while retaining the pre-edit range for rejected invalid insertions and pastes.
          element.setSelectionRange(selection.start, selection.start)
        } else {
          element.setSelectionRange(selection?.start ?? caret, selection?.end ?? caret)
        }
      }
      return
    }

    pendingCaretRef.current = caret
    onValueChange(nextValue)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = event.target.value
    const caret = event.target.selectionStart ?? raw.length
    const inputType = (event.nativeEvent as InputEvent).inputType ?? ''
    const selectionBeforeEdit = pendingSelectionRef.current
    pendingSelectionRef.current = null
    commit(raw, countDigits(raw.slice(0, caret)), inputType, selectionBeforeEdit)
  }

  const handleBeforeInput: NonNullable<React.ComponentProps<'input'>['onBeforeInput']> = (
    event,
  ): void => {
    rememberSelection(event.currentTarget)
    onBeforeInput?.(event)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
    rememberSelection(event.currentTarget)
    onPaste?.(event)
  }

  /**
   * Deleting a group separator would be undone by re-grouping, so Backspace and Delete aimed at a
   * comma are redirected to the adjacent digit.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const element = event.currentTarget
    const selectionBeforeEdit = rememberSelection(element)
    const caret = element.selectionStart
    if (caret === null || caret !== element.selectionEnd) return

    if (event.key === 'Backspace' && !isDigit(element.value[caret - 1])) {
      let cut = caret - 1
      while (cut > 0 && !isDigit(element.value[cut - 1])) cut -= 1
      if (cut <= 0) return

      const raw = `${element.value.slice(0, cut - 1)}${element.value.slice(caret)}`
      event.preventDefault()
      commit(
        raw,
        countDigits(element.value.slice(0, cut - 1)),
        'deleteContentBackward',
        selectionBeforeEdit,
      )
      return
    }

    if (event.key === 'Delete' && element.value[caret] === ',') {
      const cut = caret + 1
      if (!isDigit(element.value[cut])) return

      const raw = `${element.value.slice(0, cut)}${element.value.slice(cut + 1)}`
      event.preventDefault()
      commit(
        raw,
        countDigits(element.value.slice(0, caret)),
        'deleteContentForward',
        selectionBeforeEdit,
      )
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
        onBeforeInput={handleBeforeInput}
        onPaste={handlePaste}
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
