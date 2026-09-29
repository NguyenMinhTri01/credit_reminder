## Context

See `proposal.md` for motivation and the delta spec for observable behavior. `MoneyInput` is a
controlled input shared by card, transaction, and reconciliation forms. Its change handler sanitizes
the edited string, strips a leading minus, rejects values over 13 integer digits, and maps the caret
by counting digits. Delete currently scans across every non-digit character. `formatMoneyForInput`
rounds stored cents using string arithmetic, but can return a rounded value wider than the input and
parser allow. The transaction edit test currently casts an incomplete object through `unknown` to
`ITransaction`.

## Goals / Non-Goals

**Goals:**

- Make ignored and rejected edits preserve the controlled amount and relevant selection.
- Preserve a stored negative sign on no-op sanitization while allowing deliberate sign removal and
  keeping the existing behavior for actual digit edits.
- Keep separator-aware Delete behavior limited to grouping commas.
- Make rounded displays of valid maximum `DECIMAL(15, 2)` values stay within the 13-digit input
  limit, using the user-selected maximum-whole-amount normalization policy.
- Keep the transaction form fixture checked against the full interface.

**Non-Goals:**

- Change backend validation, database precision, canonical parsing, or API payload shape.
- Resolve metadata-only credit-limit normalization or untouched negative reconciliation submission;
  both remain outside this change pending their separate contract decisions.
- Edit archived OpenSpec artifacts or the adjudication reports.

## Decisions

### Preserve edit context for rejected input

Capture the input selection before keyboard, paste, and before-input mutations. Consume that snapshot
when handling the corresponding change. If a candidate contains no amount digits but is not an
explicit empty edit, restore the controlled value and its pre-edit selection. For an over-wide
candidate, restore the same pre-edit selection rather than assuming that one digit was inserted.
Explicitly clearing the input still emits an empty value.

### Preserve negative values only for no-op amount edits

Compare the sanitized candidate's unsigned amount digits with the controlled value's amount digits.
When those digits are unchanged and the edit did not explicitly delete the leading sign, retain the
stored negative sign. A real digit edit continues to remove the sign, and an explicit Delete or
Backspace of the sign produces the positive value without changing its digits. This uses only the
current value and edit event; it adds no hidden amount state.

### Redirect Delete only across a grouping comma

Intercept Delete when its caret is immediately before a comma and remove the following digit, since
regrouping would otherwise reinsert the comma. Allow native Delete before a leading minus so it
removes the sign. Keep the existing Backspace behavior unchanged.

### Cap only a valid stored value whose rounded magnitude overflows

Continue using string-based rounding. When the original value is within `DECIMAL(15, 2)` precision
but rounding its magnitude would produce 14 integer digits, display the largest 13-digit whole
amount, with the original sign. This affects the valid maximum amount when its cents round upward;
submitting the displayed value normalizes those cents to `.00`, as the user selected. Leave
formatting of inputs that were already outside the storage precision unchanged, and do not relax
parser or API precision checks.

### Keep the fixture local and complete

Declare the transaction edit test's fixture as `ITransaction` and provide all required fields. Do not
add a shared fixture helper for this single use.

## Risks / Trade-offs

- **The maximum valid stored amount can lose its fractional cents on form submission** → This is the
  user-selected boundary policy and is made explicit in the modified spec; ordinary in-range rounding
  remains unchanged.
- **A rejected edit may restore a selection instead of collapsing the caret** → Restoring the exact
  prior selection lets users retry without losing their edit point; explicit clear remains distinct.
- **Input event ordering varies by browser and test utilities** → Capture selection on keyboard,
  paste, and before-input paths, and cover keyboard edits plus multi-digit paste with component tests.

## Migration Plan

No data or API migration is needed. Existing form displays continue to use the shared formatter. Roll
back by reverting the focused frontend changes if the chosen maximum-boundary normalization is not
acceptable after review.
