## Context

See proposal.md — Why.

Constraints that shape the approach:

- `frontend/src/lib/money-input.utils.ts` is deliberately string-based: amounts up to `DECIMAL(15, 2)`
  must survive without floating-point rounding. Any new helper must keep that property.
- All four money fields live in React Hook Form + Zod forms and keep their **display** string in form
  state, parsing to canonical decimals only in the submit handler. Zod refinements call
  `parseMoneyInputToCanonicalDecimal()` on that display string, and it already accepts comma-grouped
  integers (`'400,000'` → `'400000.00'`), so the resolver keeps working unchanged.
- Caret preservation is only possible from the DOM node, so the component needs its own `ref`; the
  shadcn `Input` in `frontend/src/components/ui/input.tsx` already forwards refs.
- `formatVnd()` renders VND with `maximumFractionDigits: 0`, i.e. the app has never shown đồng cents
  outside of form inputs.

## Goals / Non-Goals

**Goals:**

- One component owns money entry, so a keystroke bug can only exist in one place.
- Formatting logic stays in pure, unit-testable functions; the component only wires them to DOM events
  and caret restoration.
- Existing form state shape (display string in RHF, canonical string at submit) is preserved, so no
  Zod schema or submit handler has to be restructured.

**Non-Goals:**

- No `Intl.NumberFormat` locale-aware separators. The persisted grammar is comma-grouped with a dot
  decimal, and switching the input to `vi-VN` dot grouping would desynchronise it from
  `parseMoneyInputToCanonicalDecimal()`.
- No masked-input library (`react-number-format`, `imask`). Adding a dependency for one grouping rule
  fails the bundle-size and YAGNI rules in `AGENTS.md`.
- No change to the canonical parse/serialize direction.

## Decisions

### Format on every keystroke, with an explicit caret remap

Rejected alternative: format only on blur (what `transaction-form.tsx` does today). It is the smallest
diff and cannot wipe input, but it shows an unformatted `400000` for the whole time the user is
reading the number back — which is precisely when grouping is worth having.

The change handler works in digit space, not string space:

1. Read `el.value` and `el.selectionStart` from the event target.
2. `digitsBeforeCaret = <count of [0-9] in el.value.slice(0, caret)>`.
3. Sanitize the whole value into a digit string (see next decision).
4. Group into `40,000` form.
5. Map `digitsBeforeCaret` back to a string offset in the grouped result — the position just after the
   Nth digit — and stash it in a ref.
6. Push the grouped string into RHF via `field.onChange`.
7. In `useLayoutEffect`, apply the stashed offset with `el.setSelectionRange()` so the caret is fixed
   before the browser paints.

Counting digits rather than characters is what makes the remap correct when the number of separators
changes (typing the 4th digit of `400` inserts a comma and must shift the caret by two, not one).

### Separator-deleting keys are intercepted in `onKeyDown`

With a pure change handler, Backspace on the comma of `400,000` deletes only the comma; grouping then
re-inserts it and nothing appears to happen. So `onKeyDown` checks the character adjacent to the caret
and, when it is a separator, deletes the adjacent **digit** itself and calls `preventDefault()`.
Alternative considered — diffing old and new values to detect "only a separator disappeared" — infers
intent from a string diff and misbehaves on selection deletes.

### Sanitization treats a trailing 1–2 digit fraction as cents, everything else as grouping

Stripping all non-digits is wrong for the most likely paste, `400,000.00đ`, which would become
`40,000,000` — a silent 100× error in a credit limit. So the rule, applied to the whole candidate
value, is:

1. Keep a single leading `-`; drop the `đ` suffix and whitespace.
2. If the remainder ends with `.` followed by exactly one or two digits, round to the nearest whole
   đồng, halves away from zero, using string increment (no `Number`), then drop the fraction.
3. Remove every remaining non-digit character — so `1.234.567` and `400.000` read as grouping.
4. Strip leading zeros down to at most a single `0`.
5. Truncate to 13 integer digits.

A lone `.` therefore falls out of step 3 and is simply ignored while typing, which is the desired
behavior for an integer-only field. The 3-digit-group heuristic in step 3 also resolves the
`400.000` ambiguity toward the Vietnamese reading, which is the one a user in this app means.

Rounding half away from zero (rather than truncating) matches `Intl.NumberFormat`'s default
`halfExpand`, which `formatVnd()` relies on, so a card never shows one amount on the dashboard and a
different one in the edit form.

### `formatMoneyInputDisplay` is renamed, not silently redefined

Its four call sites all hydrate a money input, and all of them now need `50,000,000` rather than
`50,000,000.00đ`. Keeping the name while inverting what it returns would leave a function whose name
promises a currency-suffixed display string; renaming it to `formatMoneyForInput` makes every call
site and its tests fail loudly if one is missed. `parseMoneyInputToCanonicalDecimal` keeps its name
and behavior.

### `MoneyInput` lives in `components/ui/`, `đ` is a positioned adornment

It is a presentational primitive with no domain knowledge, so it belongs beside `input.tsx` rather
than in `components/cards/`. Its API is `value` / `onValueChange` plus pass-through input props, which
makes it a drop-in inside the existing `Controller render` blocks. The suffix is an absolutely
positioned `aria-hidden` span with matching `pr-*` padding on the input — not an input-group wrapper —
so focus ring, height, and disabled styling are inherited from `Input` unchanged. `inputMode` becomes
`numeric` (was `decimal`), which is correct for an integer field and gives mobile users a keypad
without a decimal key.

## Risks / Trade-offs

- **Saving a card whose stored amount has non-zero cents normalises it to whole đồng** (e.g.
  `50000000.50` → `50000000.00`) → Accepted and specified as a scenario rather than hidden. The
  alternative — stashing the discarded cents and re-attaching them when the field is untouched — adds
  invisible state that would surprise anyone reading the submit payload. VND has no subunit and
  `formatVnd()` already rounds every other display of these same values.
- **Caret restoration can fight React's controlled-input re-render** → `useLayoutEffect` (not
  `useEffect`) applies the position before paint, and the ref is cleared after each application so a
  re-render triggered by anything other than a keystroke does not move the user's cursor.
- **`fireEvent.change` in the existing tests cannot express caret position** → Caret scenarios are
  covered with `userEvent` (typing, `{Backspace}`, `selectionStart` assertions); pure formatting and
  sanitization scenarios stay as fast unit tests on the utils.
- **Four call sites migrate at once, so a regression hits every money field** → Each form keeps its
  existing test file, and every scenario in the delta specs maps to a named test, so the migration is
  verified per form rather than only on the component in isolation.
