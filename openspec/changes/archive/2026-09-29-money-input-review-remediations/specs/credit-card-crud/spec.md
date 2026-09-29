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

#### Scenario: Normalizing a stored amount at the maximum whole-đồng boundary
- **WHEN** a form is populated with the largest valid `DECIMAL(15, 2)` magnitude,
  `"9999999999999.99"` or `"-9999999999999.99"`
- **THEN** the input displays the signed maximum whole amount, `9,999,999,999,999` or
  `-9,999,999,999,999`, and submitting the untouched form sends the corresponding canonical value
  with `.00`, accepting normalization of the stored cents

#### Scenario: Negative stored amount keeps its sign until it is edited
- **WHEN** a form is populated from a stored amount of `"-2500000.00"` (an overspent available credit)
- **THEN** the input displays `-2,500,000`; ignored input that changes no amount digits preserves the
  sign, an actual amount-digit edit removes the sign, and explicitly deleting the sign keeps all
  amount digits and submits the positive canonical value

## ADDED Requirements

### Requirement: Money input edits preserve valid values and cursor context
The system SHALL ignore invalid-only edits without discarding an existing amount, preserve an
intentional clear, and keep the cursor at the user's edit point when rejecting an over-wide edit.
Delete handling MUST distinguish grouping commas from a leading minus sign.

#### Scenario: Ignored characters do not change an existing amount
- **WHEN** a user types a letter, period, whitespace, or currency symbol into an amount without
  changing any amount digits
- **THEN** the displayed amount remains unchanged

#### Scenario: Ignored characters preserve a stored negative sign
- **WHEN** a money input displays `-2,500` and a user enters only ignored characters without
  changing any amount digits
- **THEN** the input remains `-2,500`

#### Scenario: Invalid text replaces a selected amount
- **WHEN** a user selects the entire `400,000` value and replaces it with a letter
- **THEN** the invalid replacement is ignored and `400,000` remains in the input

#### Scenario: User explicitly clears the amount
- **WHEN** a user selects the entire amount and deletes it
- **THEN** the input becomes empty

#### Scenario: Rejected over-wide paste restores the edit point
- **WHEN** a user pastes multiple digits at a middle caret position and the result would exceed
  13 integer digits
- **THEN** the amount remains unchanged and the cursor returns to the position it had before the
  paste

#### Scenario: Delete immediately before a leading minus sign
- **WHEN** the input displays `-2,500`, the cursor is immediately before the minus sign, and the user
  presses Delete
- **THEN** the sign is removed, all amount digits remain, and the input displays `2,500`

#### Scenario: Delete immediately before a group separator
- **WHEN** the input displays `400,000`, the cursor is immediately before the comma, and the user
  presses Delete
- **THEN** the digit following the comma is removed and the input displays `40,000`
