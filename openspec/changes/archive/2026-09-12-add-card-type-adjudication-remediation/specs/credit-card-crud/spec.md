## MODIFIED Requirements

### Requirement: User can create a credit card
The system SHALL allow an authenticated user to create a credit card by providing bank code, card type, last four digits, credit limit, available credit, statement day, payment due days after statement, and expiry date (MM/YY). Card name is optional.

#### Scenario: Successful card creation with all required fields
- **WHEN** a user submits valid card data including `bankCode`, `cardType` (one of the five supported values), `lastFourDigits` (exactly 4 numeric characters), `creditLimit` (> 0), `availableCredit`, `statementDay` (1–31), `paymentDueDaysAfterStatement` (> 0), and `expiryMonth`/`expiryYear`
- **THEN** the system creates the card, associates it with the authenticated user, and returns the card with server-generated fields (id, timestamps, resolved bank name and logo)

#### Scenario: Card creation with optional card name
- **WHEN** a user includes a `cardName` in the creation request
- **THEN** the card is stored with the user-supplied alias

#### Scenario: Last four digits preserve leading zeros
- **WHEN** a user creates a card with `lastFourDigits` value `"0012"`
- **THEN** the stored and returned value is `"0012"`, not `12` or `"12"`

#### Scenario: Monetary values use decimal strings
- **WHEN** the API returns or accepts `creditLimit` or `availableCredit`
- **THEN** values are serialized as decimal strings (e.g., `"60000000.00"`) to avoid floating-point precision loss

#### Scenario: Validation rejects invalid input
- **WHEN** a user submits a card with a missing or unsupported `cardType`, or with `lastFourDigits` that is not exactly 4 numeric characters, or `creditLimit` ≤ 0, or `statementDay` outside 1–31, or `paymentDueDaysAfterStatement` ≤ 0
- **THEN** the system returns field-level validation errors without creating the card

### Requirement: User can update card metadata
The system SHALL allow the card owner to update optional metadata fields (bank code, card type, card name, last four digits, statement day, payment due days after statement, expiry date). Updating those metadata fields SHALL NOT alter the available credit or trigger a reconciliation. `creditLimit` is separately updateable and recomputes `availableCredit` while preserving the used amount.

#### Scenario: Update bank and card name
- **WHEN** a user updates `bankCode` and `cardName` on their card
- **THEN** the stored values change and `availableCredit` remains unchanged

#### Scenario: Update credit limit adjusts available credit
- **WHEN** a user updates `creditLimit` from 50,000,000 to 80,000,000 on a card where `availableCredit` is 30,000,000 (used amount = 20,000,000)
- **THEN** `availableCredit` becomes 60,000,000 (new limit minus preserved used amount) and no reconciliation record is created

#### Scenario: Partial update
- **WHEN** a user sends an update with only one optional metadata field, such as `cardName` or a supported `cardType`
- **THEN** only that field changes; all other fields remain as stored

### Requirement: Card type is exposed with legacy-safe card responses
The system SHALL include `cardType` in credit-card detail, list, create, update, restore, and dashboard card payloads. For cards created before card types were introduced, the field is `null`; those cards MUST remain readable and usable by existing card operations.

#### Scenario: Existing typed card is returned
- **WHEN** an API client retrieves a card that has a stored card type
- **THEN** the response contains the stored `cardType` value without changing its enum spelling

#### Scenario: Legacy card without a type is returned
- **WHEN** an API client retrieves a legacy card whose `cardType` is `null`
- **THEN** the response contains the explicit property `cardType: null` and does not fail the request

#### Scenario: Legacy card remains editable
- **WHEN** the owner updates a non-card-type field on a legacy card
- **THEN** the update succeeds and the card remains available for later assignment of a supported type

## ADDED Requirements

### Requirement: Card type selection in card forms is accessible and consistent
The card form SHALL provide a select control containing exactly the five supported card types, require a selection when creating a card, and display a matching compact logo in each option and the selected trigger while preserving the option order and accessible labels.

#### Scenario: Card form exposes only supported types
- **WHEN** a user creates or edits a card
- **THEN** the form provides a select control containing exactly the five supported types, requires a selection for creation, and displays a clear validation message when creation is submitted without one

#### Scenario: Card type selector displays matching logos
- **WHEN** a user opens the card-type select or chooses a supported card type
- **THEN** each option and the selected trigger display the matching compact card-type logo without changing the available options or their order
