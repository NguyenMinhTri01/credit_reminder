## MODIFIED Requirements

### Requirement: User can update card metadata
The system SHALL allow the card owner to update optional metadata fields (bank code, card type, card name, last four digits, statement day, payment due days after statement, expiry date). Updating those metadata fields SHALL NOT alter the available credit or trigger a reconciliation. `creditLimit` is separately updateable and recomputes `availableCredit` while preserving the used amount.

#### Scenario: Update bank and card name
- **WHEN** a user updates `bankCode` and `cardName` on their card
- **THEN** the stored values change and `availableCredit` remains unchanged

#### Scenario: Metadata-only update preserves stored credit-limit cents
- **WHEN** a user updates card metadata while the existing `creditLimit` is `"50000000.50"` and the edit form displays the rounded whole-đồng value
- **THEN** the update omits the unchanged `creditLimit`, preserves its stored cents, and leaves `availableCredit` unchanged

#### Scenario: Update credit limit adjusts available credit
- **WHEN** a user updates `creditLimit` from 50,000,000 to 80,000,000 on a card where `availableCredit` is 30,000,000 (used amount = 20,000,000)
- **THEN** `availableCredit` becomes 60,000,000 (new limit minus preserved used amount) and no reconciliation record is created

#### Scenario: Partial update
- **WHEN** a user sends an update with only one optional metadata field, such as `cardName` or a supported `cardType`
- **THEN** only the supplied field changes; all other fields remain as stored

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

#### Scenario: Normalizing a submitted amount at the maximum whole-đồng boundary
- **WHEN** a form submits a money-input value populated with the largest valid `DECIMAL(15, 2)` magnitude,
  `"9999999999999.99"` or `"-9999999999999.99"`
- **THEN** the input displays the signed maximum whole amount, `9,999,999,999,999` or
  `-9,999,999,999,999`, and the submitted field is serialized to the corresponding canonical value
  with `.00`, accepting normalization of the stored cents

#### Scenario: Negative stored amount keeps its sign until it is edited
- **WHEN** a form is populated from a stored amount of `"-2500000.00"` (an overspent available credit)
- **THEN** the input displays `-2,500,000`; ignored input that changes no amount digits preserves the
  sign, an actual amount-digit edit removes the sign, and explicitly deleting the sign keeps all
  amount digits and submits the positive canonical value
