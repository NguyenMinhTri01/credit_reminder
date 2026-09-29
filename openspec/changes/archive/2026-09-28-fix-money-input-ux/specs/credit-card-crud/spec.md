## MODIFIED Requirements

### Requirement: Form money inputs format values for display and serialize canonical decimal strings
The system SHALL render monetary inputs across credit card management forms as whole-đồng amounts
using comma thousand-group separators and no fractional part, with the `đ` currency symbol presented
as a non-editable suffix that is never part of the editable value, while sending canonical decimal
strings with two fractional digits and no presentation formatting to backend mutation endpoints.

#### Scenario: User enters monetary amount
- **WHEN** a user enters `400000` into a money input (`creditLimit`, `availableCredit`)
- **THEN** the input's editable value is `400,000` and the `đ` symbol is displayed beside it without
  becoming part of the value the user can edit or delete

#### Scenario: Form submission serializes canonical decimal string
- **WHEN** a form whose money input shows `400,000` is submitted
- **THEN** the submitted payload contains the canonical decimal string `"400000.00"` without commas,
  currency symbols, or whitespace

#### Scenario: Populating form with existing decimal values
- **WHEN** an existing card with limit `"50000000.00"` is opened in the edit form
- **THEN** the input displays `50,000,000` without losing precision or mutating the stored balance

#### Scenario: Populating form with a stored fractional amount
- **WHEN** an existing card whose stored limit is `"50000000.50"` is opened in the edit form
- **THEN** the input displays `50,000,001`, rounded to the nearest whole đồng with halves rounded
  away from zero, so the form shows the same amount the rest of the application renders for that card

#### Scenario: Negative stored amount keeps its sign until it is edited
- **WHEN** a form is populated from a stored amount of `"-2500000.00"` (an overspent available credit)
- **THEN** the input displays `-2,500,000` and submitting the untouched form sends `"-2500000.00"`,
  while editing the field drops the sign because a negative amount cannot be entered

## ADDED Requirements

### Requirement: Money inputs accept keystrokes without discarding input
The system SHALL re-apply group formatting to a money input on every keystroke while preserving every
digit the user has entered and keeping the text cursor at the position being edited. A money input
MUST NOT clear itself, reset itself to zero, or move the cursor to the end of the value as a result of
formatting.

#### Scenario: Typing digits one at a time
- **WHEN** a user types `4`, `0`, `0`, `0`, `0`, `0` into an empty money input, one keystroke at a time
- **THEN** the value progresses `4` → `40` → `400` → `4,000` → `40,000` → `400,000` and is never
  emptied or replaced by a zero amount at any point in the sequence

#### Scenario: Typing in the middle of an existing value
- **WHEN** the value is `400,000`, the cursor sits between the `4` and the first `0`, and the user
  types `5`
- **THEN** the value becomes `4,500,000` and the cursor sits immediately after the digit just typed,
  between the `5` and the following `0`

#### Scenario: Backspace immediately after a group separator
- **WHEN** the value is `400,000`, the cursor sits immediately after the comma, and the user presses
  Backspace
- **THEN** the digit preceding the comma is deleted, the value becomes `40,000`, and the cursor sits
  immediately after the last digit the user kept — pressing Backspace never leaves the value unchanged

#### Scenario: Forward delete immediately before a group separator
- **WHEN** the value is `400,000`, the cursor sits immediately before the comma, and the user presses
  Delete
- **THEN** the digit following the comma is deleted, the value becomes `40,000`, and the cursor
  remains between the digits the user kept

#### Scenario: Clearing the whole value
- **WHEN** a user selects the entire value and deletes it
- **THEN** the input becomes empty rather than showing a zero amount, and the field's own required
  validation decides whether an empty value is an error

### Requirement: Money inputs sanitize out-of-grammar text and bound stored precision
The system SHALL reduce any text entered into or pasted into a money input to a non-negative
whole-đồng amount, silently discarding characters that are not part of that amount, and MUST NOT
accept more integer digits than the persisted `DECIMAL(15, 2)` amount columns can store.

#### Scenario: Non-numeric characters are ignored
- **WHEN** a user types a letter, a space, a period, or the `đ` symbol into a money input
- **THEN** the character is not inserted and the value already in the field is left unchanged

#### Scenario: A minus sign cannot be entered
- **WHEN** a user types `-` into a money input, alone or ahead of digits such as `-5000`
- **THEN** the sign is discarded and the field holds the non-negative amount (`5,000`), so no form
  that forbids negative amounts can be submitted with one and negative zero can never be produced

#### Scenario: Pasting an amount that carries a two-decimal fraction
- **WHEN** a user pastes `400,000.00đ` or `400000.75` into a money input
- **THEN** the trailing fractional part is rounded away to the nearest whole đồng and the value
  becomes `400,000` and `400,001` respectively

#### Scenario: Pasting a dot-grouped amount
- **WHEN** a user pastes `1.234.567` or `400.000` into a money input
- **THEN** the separators are discarded as grouping rather than read as a fraction, and the value
  becomes `1,234,567` and `400,000` respectively

#### Scenario: Leading zeros are normalized
- **WHEN** a user enters `000400`
- **THEN** the value becomes `400`, and entering `0` alone still yields `0`

#### Scenario: Integer digits are capped at the storable precision
- **WHEN** a user attempts to enter a 14th integer digit into a money input
- **THEN** the keystroke is rejected, the value stays at its 13-digit amount, and the form does not
  reach submit with an amount the API would reject for exceeding `DECIMAL(15, 2)`
