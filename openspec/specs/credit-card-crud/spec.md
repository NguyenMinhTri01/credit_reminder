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
The system SHALL allow an authenticated user to create a credit card by providing bank code, last four digits, credit limit, available credit, statement day, payment due days after statement, and expiry date (MM/YY). Card name is optional.

#### Scenario: Successful card creation with all required fields
- **WHEN** a user submits valid card data including `bankCode`, `lastFourDigits` (exactly 4 numeric characters), `creditLimit` (> 0), `availableCredit`, `statementDay` (1–31), `paymentDueDaysAfterStatement` (> 0), and `expiryMonth`/`expiryYear`
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
- **WHEN** a user submits a card with `lastFourDigits` that is not exactly 4 numeric characters, or `creditLimit` ≤ 0, or `statementDay` outside 1–31, or `paymentDueDaysAfterStatement` ≤ 0
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
The system SHALL allow the card owner to update metadata fields (bank code, card name, last four digits, statement day, payment due days after statement, expiry date). Updating those metadata fields SHALL NOT alter the available credit or trigger a reconciliation. `creditLimit` is separately updateable and recomputes `availableCredit` while preserving the used amount.

#### Scenario: Update bank and card name
- **WHEN** a user updates `bankCode` and `cardName` on their card
- **THEN** the stored values change and `availableCredit` remains unchanged

#### Scenario: Update credit limit adjusts available credit
- **WHEN** a user updates `creditLimit` from 50,000,000 to 80,000,000 on a card where `availableCredit` is 30,000,000 (used amount = 20,000,000)
- **THEN** `availableCredit` becomes 60,000,000 (new limit minus preserved used amount) and no reconciliation record is created

#### Scenario: Partial update
- **WHEN** a user sends an update with only `cardName`
- **THEN** only `cardName` changes; all other fields remain as stored

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
The system SHALL format monetary inputs across credit card management forms with thousand grouping commas, decimal point, and currency suffix in presentation, while sending canonical decimal strings without presentation formatting to backend mutation endpoints.

#### Scenario: User enters monetary amount
- **WHEN** a user enters `400000` into a money input (`creditLimit`, `availableCredit`)
- **THEN** the input displays the formatted value `400,000.00đ`

#### Scenario: Form submission serializes canonical decimal string
- **WHEN** a form with formatted monetary input `400,000.00đ` is submitted
- **THEN** the submitted payload contains the canonical decimal string `"400000.00"` without commas, currency symbols, or whitespace

#### Scenario: Populating form with existing decimal values
- **WHEN** an existing card with limit `"50000000.00"` is opened in the edit form
- **THEN** the input displays `50,000,000.00đ` without losing precision or mutating the stored balance
