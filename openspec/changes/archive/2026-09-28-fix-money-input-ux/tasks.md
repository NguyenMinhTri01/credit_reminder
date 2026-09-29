## 1. Money input utilities

- [x] 1.1 Add `sanitizeMoneyInputDigits(raw)` to `frontend/src/lib/money-input.utils.ts`
      implementing the sanitization steps from design.md (sign, trailing 1–2 digit fraction rounded
      half away from zero via string increment, remaining non-digits dropped, leading zeros
      stripped); verify with unit tests covering `400,000.00đ` → `400000`, `400000.75` → `400001`,
      `1.234.567` → `1234567`, `400.000` → `400000`, `000400` → `400`, a lone `.` → unchanged, and a
      14-digit input returned uncapped so the component can reject the keystroke instead of
      truncating a storable amount (truncating would rewrite the other digits when the edit happens
      mid-value, which the digit-cap spec scenario forbids)
- [x] 1.2 Add `groupMoneyDigits(digits)` returning comma-grouped integers and
      `caretOffsetForDigitIndex(formatted, digitIndex)` returning the string offset just after the
      Nth digit; verify with unit tests asserting `groupMoneyDigits('400000') === '400,000'` and that
      digit index 3 in `400,000` maps to offset 3 — before the separator, so a following Backspace
      deletes a digit directly rather than relying on separator interception
- [x] 1.3 Rename `formatMoneyInputDisplay` to `formatMoneyForInput` and change it to return a grouped
      whole-đồng string with no `đ` suffix, preserving a leading `-`; verify by updating
      `money-input.utils.test.ts` so `formatMoneyForInput('50000000.00') === '50,000,000'`,
      `formatMoneyForInput('50000000.50') === '50,000,001'`, and
      `formatMoneyForInput('-2500000.00') === '-2,500,000'`
- [x] 1.4 Confirm `parseMoneyInputToCanonicalDecimal` still accepts the new display grammar unchanged;
      verify with a round-trip test `'400000'` → `'400,000'` → `'400000.00'` and a negative
      round-trip `'-2500000.00'` → `'-2,500,000'` → `'-2500000.00'`
- [x] 1.5 Run `pnpm --filter frontend test src/lib/money-input.utils.test.ts` and verify the whole
      utils suite passes

## 2. MoneyInput component

- [x] 2.1 Create `frontend/src/components/ui/money-input.tsx` wrapping the shadcn `Input` with
      `value`/`onValueChange` props, an internal ref, `inputMode="numeric"`, `autoComplete="off"`,
      and the `aria-hidden` `đ` suffix positioned over right padding; verify the component renders
      with an accessible name from its external `<Label htmlFor>` and shows the suffix
- [x] 2.2 Implement the change handler per design.md — count digits before the caret, sanitize, group,
      stash the remapped caret offset in a ref, emit via `onValueChange`, restore with
      `setSelectionRange` in `useLayoutEffect`; verify with `userEvent` tests that typing
      `4`,`0`,`0`,`0`,`0`,`0` yields `4` → `40` → `400` → `4,000` → `40,000` → `400,000` and never
      empties the field
- [x] 2.3 Verify mid-value editing with a test that places the caret after the `4` in `400,000`, types
      `5`, and asserts the value is `4,500,000` and `selectionStart` sits immediately after the typed
      `5`
- [x] 2.4 Implement the `onKeyDown` interception so Backspace adjacent to a separator deletes the
      preceding digit and Delete adjacent to a separator deletes the following digit; verify with
      tests asserting both produce `40,000` from `400,000` with the caret between the kept digits
- [x] 2.5 Verify the remaining sanitization scenarios at component level: typing a letter, space, `.`
      or `đ` leaves the value unchanged; pasting `400,000.00đ` yields `400,000`; selecting all and
      deleting yields an empty value rather than `0`; a 14th digit keystroke is rejected

## 3. Migrate the money fields

- [x] 3.1 Replace both money inputs in `frontend/src/components/cards/card-form.tsx` with `MoneyInput`
      and hydrate defaults through `formatMoneyForInput`; verify by updating `card-form.test.tsx` so
      entering `400000` shows `400,000` in `formCreditLimit`/`formAvailableCredit` and submitting
      still sends `creditLimit: '400000.00'` and `availableCredit: '400000.00'`
- [x] 3.2 Update the edit-mode assertions in `card-form.test.tsx` and
      `edit-card-sheet.test.tsx` from `50,000,000.00đ`/`30,000,000.00đ` to `50,000,000`/`30,000,000`
      and verify both suites pass, including the existing "rejects clearing creditLimit" case
- [x] 3.3 Replace the amount input in `frontend/src/components/cards/transaction-form.tsx` with
      `MoneyInput`, removing the `onFocus` canonicalization and `onBlur` reformatting; verify with a
      test that typing `200000` shows `200,000`, focusing and blurring without typing leaves it
      unchanged, and submit sends `amount: '200000.00'`
- [x] 3.4 Replace the `availableCredit` input in `frontend/src/components/cards/reconcile-form.tsx`
      with `MoneyInput` (keeping `autoFocus`); verify with a test that the form hydrates
      `"50000000.00"` as `50,000,000` and submits `"50000000.00"` untouched
- [x] 3.5 Verify no `formatMoneyInputDisplay` references or hand-rolled money `onChange` handlers
      remain by grepping `frontend/src` for `formatMoneyInputDisplay` and
      `formatMoneyInputDisplay(e.target.value)` and getting no matches

## 4. Verification

- [x] 4.1 Run `pnpm --filter frontend test` and verify the full frontend suite passes
- [x] 4.2 Run `pnpm typecheck:frontend` and `pnpm --filter frontend lint` and verify both are clean
- [x] 4.3 Manually exercise `pnpm dev:frontend` on the add-card, edit-card, add-transaction and
      reconcile forms and verify typing an amount never resets to zero, grouping appears live, and the
      caret stays where the user is typing
- [x] 4.4 Run `openspec validate fix-money-input-ux --strict` and verify the change validates
