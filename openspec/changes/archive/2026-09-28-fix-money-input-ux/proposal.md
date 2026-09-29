## Why

Every monetary form input in the app reformats its value with `formatMoneyInputDisplay()` on each
keystroke, which appends `.00đ` immediately. The next character the user types produces a string such
as `4.00đ5`, which fails `isValidMoneySyntax()`, so the formatter returns an empty string and the
field is wiped — the user perceives this as the amount "resetting to 0.00". Entering an amount is
currently only possible by typing all digits in one uninterrupted burst and hoping the formatter
agrees, which makes card creation and transaction entry actively frustrating.

`transaction-form.tsx` already sidesteps the bug by formatting on `blur` instead of `change`, so the
app also ships two inconsistent money-entry behaviours.

## What Changes

- Add a shared, reusable `MoneyInput` UI primitive that all monetary form inputs use, replacing the
  four hand-rolled `Controller` + `onChange`/`onFocus`/`onBlur` variants.
- Format while typing instead of after typing: the input inserts thousand-group separators live and
  restores the caret to the character the user was editing, so typing, pasting, backspacing and
  deleting never discard input.
- **BREAKING (UI only)** Money inputs become whole-đồng (integer) fields. The `.00` fractional part
  is removed from the input display, matching `formatVnd()` which already renders VND with
  `maximumFractionDigits: 0`. Submitted payloads still carry canonical `"400000.00"` decimal strings,
  so no API or database contract changes.
- Move the `đ` currency symbol out of the editable value into a static suffix adornment, eliminating
  the root cause of the invalid-syntax wipe.
- Cap entry at the 13 integer digits that `DECIMAL(15, 2)` can store, instead of accepting digits the
  parser will silently reject at submit time.
- Refuse a typed minus sign. All four fields reject negative amounts in validation anyway, so
  blocking the sign at entry removes the negative-zero case entirely; a negative amount already
  stored on a card still hydrates with its sign until the field is edited.
- Rename `formatMoneyInputDisplay()` to `formatMoneyForInput()` and change it to emit a grouped
  integer string (`50,000,000`) so hydration of existing cards matches the new input grammar.
  `parseMoneyInputToCanonicalDecimal()` is unchanged and already accepts grouped integers.

Explicitly out of scope: backend validation, currency other than VND, per-locale separators, and any
change to how money is rendered outside form inputs.

## Capabilities

### New Capabilities

<!-- None. This change corrects the behaviour of existing money input requirements. -->

### Modified Capabilities

- `credit-card-crud`: the requirement "Form money inputs format values for display and serialize
  canonical decimal strings" changes its display grammar (whole đồng, `đ` as a non-editable suffix)
  and gains requirements for keystroke-level behaviour — live grouping, caret preservation, paste
  handling, separator deletion, digit cap — that the current requirement leaves unspecified.
- `credit-card-available-credit`: the transaction `amount` input and the reconciliation
  `availableCredit` input are bound to the same shared money-input behaviour, removing the divergent
  format-on-blur behaviour that the spec never described.

## Impact

- New: `frontend/src/components/ui/money-input.tsx` (+ test).
- Changed: `frontend/src/lib/money-input.utils.ts` — `formatMoneyInputDisplay` renamed/redefined,
  plus digit-sanitising, grouping and caret-mapping helpers.
- Changed consumers: `frontend/src/components/cards/card-form.tsx` (`creditLimit`,
  `availableCredit`), `transaction-form.tsx` (`amount`), `reconcile-form.tsx` (`availableCredit`).
- Changed tests: `money-input.utils.test.ts`, `card-form.test.tsx`, `edit-card-sheet.test.tsx`
  (assertions on `50,000,000.00đ` style values), `reconcile-form.test.tsx` and
  `transaction-form.test.tsx`.
- New devDependency: `@testing-library/user-event`, needed to drive caret position in tests.
  Test-only, so it does not affect the shipped bundle.
- Behavioural risk to confirm during review: a stored amount with non-zero cents (e.g.
  `"50000000.50"`) hydrates as `50,000,000` and, if the form is saved, is normalised to
  `"50000000.00"`. VND has no subunit and the whole UI already rounds for display, so this is
  accepted deliberately rather than carrying hidden fractional state.
- No backend, Prisma, or API changes.
