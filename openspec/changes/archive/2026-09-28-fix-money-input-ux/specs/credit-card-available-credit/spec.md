## ADDED Requirements

### Requirement: Transaction and reconciliation amount inputs behave like every other money input
The system SHALL apply the same money-input behavior to the transaction `amount` input and the
reconciliation `availableCredit` input that it applies to credit card form money inputs: whole-đồng
display with comma grouping, a non-editable `đ` suffix, keystroke-level formatting that preserves the
typed digits and cursor position, and canonical two-decimal serialization on submit. These inputs MUST
NOT defer formatting until the field loses focus, and MUST NOT rewrite the value when the field gains
focus.

#### Scenario: Entering a transaction amount digit by digit
- **WHEN** a user types `2`, `0`, `0`, `0`, `0`, `0` into the transaction amount input
- **THEN** the value progresses to `200,000` with grouping applied on each keystroke, is never
  emptied, and submitting sends the canonical amount `"200000.00"`

#### Scenario: Focusing an amount input does not alter its value
- **WHEN** a user focuses a transaction amount input that already shows `200,000` and then focuses
  away without typing
- **THEN** the displayed value is still `200,000` and no unformatted or re-formatted intermediate
  value is shown

#### Scenario: Reconciliation input is populated from the stored balance
- **WHEN** the reconciliation form is opened for a card whose stored `availableCredit` is
  `"50000000.00"`
- **THEN** the input shows `50,000,000`, and reconciling without editing it submits
  `"50000000.00"` so the balance is unchanged
