# Credit Card CRUD Specification

## Purpose

Allow authenticated users to create, view, edit, soft-delete, and restore their credit cards, selecting a bank from a code-managed catalog with stable identifiers, and enforcing data ownership across all operations.

## Requirements

### Requirement: Bank catalog is available as a constant registry
The system SHALL maintain a bank catalog as an in-code constant containing a stable `bankCode`, a display name, and a logo asset path for each supported institution. The catalog SHALL be exposed through a read-only API endpoint so the frontend does not duplicate the list.

#### Scenario: Client fetches the bank catalog
- **WHEN** any authenticated client requests the bank catalog endpoint
- **THEN** the response contains an ordered list of all supported banks, each with `bankCode`, `name`, `shortName`, `logoPath`, and `category`

#### Scenario: Unknown bank code is submitted
- **WHEN** a client submits a card create or update request with a `bankCode` not present in the catalog
- **THEN** the system rejects the request with a validation error

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

### Requirement: User can view their cards
The system SHALL provide a list endpoint returning all cards belonging to the authenticated user, including soft-deleted cards so the owner can use the recycle-bin/restore flow. The dashboard remains responsible for excluding soft-deleted cards from aggregate views, and the detail endpoint returns a single non-deleted card by ID.

#### Scenario: List returns the user's cards for active and deleted views
- **WHEN** an authenticated user requests their card list
- **THEN** the response contains only cards where `userId` matches the authenticated user, ordered by creation date, and includes `deletedAt` so the client can separate active cards from cards eligible for restoration

#### Scenario: Detail returns a single card with computed fields
- **WHEN** an authenticated user requests a card by ID that belongs to them
- **THEN** the response includes stored fields plus computed fields (bank display name, logo path, utilization percentage)

#### Scenario: Card belongs to another user
- **WHEN** an authenticated user requests a card ID belonging to a different user
- **THEN** the system returns a not-found response without revealing the card exists

#### Scenario: Card has been soft-deleted
- **WHEN** an authenticated user requests a card ID that has been soft-deleted
- **THEN** the system returns a not-found response through the standard detail endpoint

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
- **THEN** only the supplied field changes; all other fields remain as stored

### Requirement: User can soft-delete and restore a card
The system SHALL support soft deletion (setting `deletedAt` timestamp) and restoration (clearing `deletedAt`). Soft-deleted cards are excluded from listings and aggregate calculations but remain in the database with their transactions.

#### Scenario: Soft-delete sets timestamp
- **WHEN** a user deletes their card
- **THEN** the card's `deletedAt` is set to the current timestamp and the card no longer appears in list or dashboard queries

#### Scenario: Transactions are preserved after soft delete
- **WHEN** a card is soft-deleted
- **THEN** its transaction records remain in the database and can be accessed if the card is restored

#### Scenario: Restore clears deleted timestamp
- **WHEN** a user restores a previously soft-deleted card
- **THEN** `deletedAt` is set to null and the card reappears in listings and aggregates

#### Scenario: Delete confirmation communicates impact
- **WHEN** the frontend displays the delete confirmation dialog
- **THEN** the dialog explains that the card will be hidden from the dashboard and card list but data is preserved and recoverable

### Requirement: All card operations enforce ownership
The system SHALL verify that the authenticated user owns the target card for every read, update, delete, and restore operation. User ID MUST come from the authenticated session, not from the request body or query parameters.

#### Scenario: Ownership check on update
- **WHEN** a user attempts to update a card they do not own
- **THEN** the system returns a not-found error without modifying the card

#### Scenario: Ownership check on delete
- **WHEN** a user attempts to delete a card they do not own
- **THEN** the system returns a not-found error without deleting the card

#### Scenario: User ID source
- **WHEN** any card operation is performed
- **THEN** the user ID is extracted from the JWT-authenticated session, not from any client-supplied field

### Requirement: Legacy data remains accessible
The system SHALL handle cards created before this change that may lack `lastFourDigits`, `expiryMonth`, `expiryYear`, or `paymentDueDaysAfterStatement`. Missing fields display as unavailable rather than synthetic defaults.

#### Scenario: Card without expiry date
- **WHEN** a legacy card has no `expiryMonth` or `expiryYear`
- **THEN** the UI shows an "unavailable" indicator for the expiry field and no expiry warning is generated

#### Scenario: Card without payment due days after statement
- **WHEN** a legacy card has `dueDay` but no `paymentDueDaysAfterStatement`
- **THEN** the system falls back to using `dueDay` as a fixed day-in-month for due-date calculation until the user updates the card configuration

#### Scenario: Bank name without bank code
- **WHEN** a legacy card has `bankName` but no `bankCode`
- **THEN** the card displays the stored `bankName` text and a generic bank icon instead of the catalog logo

### Requirement: Bank selection in card form is accessible and compact
The card form SHALL provide a bank selector that displays exactly one logo and a single-line compact label in the trigger, while preserving full institution names in the selection menu and maintaining accessibility attributes.

#### Scenario: Selected bank trigger displays single logo and compact name
- **WHEN** a user selects a bank in the card form
- **THEN** the select trigger displays exactly one bank logo and the bank's short name, truncating long text on a single line with `min-w-0` without expanding the vertical height of the control

#### Scenario: Bank dropdown options render logo and full institutional name
- **WHEN** the user expands the bank select dropdown
- **THEN** each option renders the institution's logo alongside its complete full name, grouped by category

#### Scenario: Missing or unresolvable bank logo uses fallback
- **WHEN** a selected or listed bank logo fails to load or has an unknown code
- **THEN** the selector renders the generic bank icon fallback

### Requirement: Four-digit card identifier strictly accepts four numeric digits
The system SHALL ensure the card's last-four-digits input accepts only ASCII numeric digits `0-9`, preserving leading zeros, and rejecting or filtering non-numeric characters and invalid lengths at both UI and API boundaries.

#### Scenario: Valid four-digit input with leading zeros
- **WHEN** a user enters `"0012"` into the last four digits input
- **THEN** the form retains `"0012"`, submits `"0012"`, and the backend stores and returns `"0012"`

#### Scenario: Invalid characters and lengths are rejected
- **WHEN** a user enters letters, whitespace, symbols, fewer than 4 digits (e.g. `"123"`), or attempts to enter more than 4 digits (e.g. `"12345"`)
- **THEN** non-numeric characters are blocked or stripped at input, and submitting fewer than 4 digits produces a field-level validation error

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

### Requirement: Credit card type is controlled and persisted
The system SHALL support exactly five card types: `VISA`, `MASTERCARD`, `AMERICAN_EXPRESS`, `JCB`, and `NAPAS`. A card creation request MUST include `cardType`, while an update request MAY include `cardType`; supplied values MUST be validated against this supported set before persistence.

#### Scenario: Create a card with each supported type
- **WHEN** an authenticated user creates a card with any one of the five supported `cardType` values
- **THEN** the system stores that exact value and returns it in the created card response

#### Scenario: Create a card without a card type
- **WHEN** an authenticated user creates a card without `cardType`
- **THEN** the API rejects the request with a field-level validation error and does not create the card

#### Scenario: Create or update a card with an unsupported type
- **WHEN** a client submits a `cardType` outside the supported set for creation or update
- **THEN** the API rejects the request with a validation error and leaves the stored card unchanged

#### Scenario: Update a card type
- **WHEN** a card owner updates an existing card with one of the supported `cardType` values
- **THEN** the system stores the new value and returns the updated card with that value

### Requirement: Card type is exposed with legacy-safe card responses
The system SHALL include `cardType` in credit-card detail, list, create, update, restore, and dashboard card payloads. For cards created before card types were introduced, the field SHALL be `null`; those cards MUST remain readable and usable by existing card operations.

#### Scenario: Existing typed card is returned
- **WHEN** an API client retrieves a card that has a stored card type
- **THEN** the response contains the stored `cardType` value without changing its enum spelling

#### Scenario: Legacy card without a type is returned
- **WHEN** an API client retrieves a legacy card whose `cardType` is null
- **THEN** the response contains the explicit property `cardType: null` and does not fail the request

#### Scenario: Legacy card remains editable
- **WHEN** the owner updates a non-card-type field on a legacy card
- **THEN** the update succeeds and the card remains available for later assignment of a supported type

### Requirement: Card type selection in card forms is accessible and consistent
The card form SHALL provide a select control containing exactly the five supported card types, require a selection when creating a card, and display a matching compact logo in each option and the selected trigger while preserving the option order and accessible labels. When the current card type is missing or unrecognized, the trigger SHALL display a generic compact card-type visual and an unavailable label.

#### Scenario: Card form exposes only supported types
- **WHEN** a user creates or edits a card
- **THEN** the form provides a select control containing exactly the five supported types, requires a selection for creation, and displays a clear validation message when creation is submitted without one

#### Scenario: Card type selector displays matching logos
- **WHEN** a user opens the card-type select or chooses a supported card type
- **THEN** each option and the selected trigger display the matching compact card-type logo without changing the available options or their order

#### Scenario: Legacy card type trigger uses a safe fallback
- **WHEN** a user edits a card whose `cardType` is `null` or unrecognized and no supported type is selected
- **THEN** the card-type trigger displays a generic compact card-type visual and the unavailable label without breaking the form layout
