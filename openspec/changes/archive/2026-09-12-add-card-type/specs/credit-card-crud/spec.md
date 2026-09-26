## ADDED Requirements

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

The system SHALL include `cardType` in credit-card detail, list, create, update, restore, and dashboard card payloads. For cards created before card types were introduced, the field MAY be null; those cards MUST remain readable and usable by existing card operations.

#### Scenario: Existing typed card is returned

- **WHEN** an API client retrieves a card that has a stored card type
- **THEN** the response contains the stored `cardType` value without changing its enum spelling

#### Scenario: Legacy card without a type is returned

- **WHEN** an API client retrieves a legacy card whose `cardType` is null
- **THEN** the response contains a null or absent-safe card type according to the API contract and does not fail the request

#### Scenario: Legacy card remains editable

- **WHEN** the owner updates a non-card-type field on a legacy card
- **THEN** the update succeeds and the card remains available for later assignment of a supported type
