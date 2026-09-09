# Credit Card Available Credit Specification

## Purpose

Track available credit on each card through manual transactions (expenses, payments, refunds) and manual reconciliation, maintaining a consistent relationship between credit limit, used amount, and available credit.

## Requirements

### Requirement: Available credit is initialized at card creation
The system SHALL accept an `availableCredit` value when creating a card and store it as the initial baseline. The used amount is derived as `creditLimit − availableCredit`.

#### Scenario: Card created with matching limit and available credit
- **WHEN** a user creates a card with `creditLimit` 60,000,000 and `availableCredit` 60,000,000
- **THEN** the used amount is 0 and the card shows 0% utilization

#### Scenario: Card created with partial usage
- **WHEN** a user creates a card with `creditLimit` 100,000,000 and `availableCredit` 60,000,000
- **THEN** the used amount is 40,000,000 and utilization is 40%

### Requirement: Manual transactions update available credit automatically
The system SHALL adjust the card's `availableCredit` when a user-created transaction is created. The direction depends on the transaction type: `EXPENSE` decreases available credit, `PAYMENT` and `REFUND` increase it. System-generated `ADJUSTMENT` transactions document reconciliation deltas and SHALL NOT apply a second balance change.

#### Scenario: Expense reduces available credit
- **WHEN** a card has `availableCredit` 60,000,000 and the user records an `EXPENSE` of 5,000,000
- **THEN** `availableCredit` becomes 55,000,000

#### Scenario: Payment increases available credit
- **WHEN** a card has `availableCredit` 55,000,000 and the user records a `PAYMENT` of 10,000,000
- **THEN** `availableCredit` becomes 65,000,000

#### Scenario: Refund increases available credit
- **WHEN** a card has `availableCredit` 62,000,000 and the user records a `REFUND` of 2,000,000
- **THEN** `availableCredit` becomes 64,000,000

#### Scenario: Available credit can exceed the limit
- **WHEN** payments or refunds cause `availableCredit` to exceed `creditLimit`
- **THEN** the system stores the actual value without clamping it to the limit

#### Scenario: Available credit can be negative
- **WHEN** expenses cause `availableCredit` to go below zero
- **THEN** the system stores the actual negative value without clamping it to zero

### Requirement: Transaction creation requires explicit type
The system SHALL require a `type` field (`EXPENSE`, `PAYMENT`, `REFUND`) on every user-created transaction. `ADJUSTMENT` is reserved for system-generated reconciliation records. The system MUST NOT infer the direction from the description, amount sign, or any other heuristic.

#### Scenario: Transaction without type is rejected
- **WHEN** a user submits a transaction without a `type` field
- **THEN** the system returns a validation error

#### Scenario: User-created transaction fields
- **WHEN** a user creates a transaction
- **THEN** the system accepts `type`, `amount` (positive decimal string), `transactionDate` (YYYY-MM-DD), and optional `description` and `merchant`

#### Scenario: Reconciliation adjustment fields
- **WHEN** the system creates an `ADJUSTMENT` transaction during reconciliation
- **THEN** its `amount` is a signed delta for auditability, and the reconciliation's direct balance assignment is the only balance change

### Requirement: Transaction and card update are atomic
The system SHALL update the transaction record and the card's `availableCredit` within a single database transaction so that a failure in either operation leaves both unchanged.

#### Scenario: Partial failure rolls back
- **WHEN** the card update fails after the transaction record is inserted
- **THEN** neither the transaction nor the card balance change is persisted

#### Scenario: Concurrent transactions do not lose updates
- **WHEN** two transactions for the same card are submitted simultaneously
- **THEN** both are applied and the final `availableCredit` reflects both changes without losing either

### Requirement: Duplicate submission does not double-count
The system SHALL use idempotency mechanisms to prevent the same transaction from being applied twice when a client retries a request.

#### Scenario: Retried create with same idempotency key
- **WHEN** a client retries a transaction creation with the same idempotency key
- **THEN** the system returns the original transaction without creating a duplicate or adjusting the balance again

### Requirement: Editing a transaction adjusts the balance difference
The system SHALL allow the card owner to edit a transaction's amount or type. The card's `availableCredit` SHALL be adjusted by the net difference between the old and new effect.

#### Scenario: Increase expense amount
- **WHEN** a user edits an `EXPENSE` from 5,000,000 to 7,000,000
- **THEN** `availableCredit` decreases by an additional 2,000,000

#### Scenario: Change type from expense to payment
- **WHEN** a user changes a transaction from `EXPENSE` 5,000,000 to `PAYMENT` 5,000,000
- **THEN** `availableCredit` increases by 10,000,000 (reversing the 5M decrease and applying a 5M increase)

### Requirement: Deleting a transaction reverses its effect
The system SHALL reverse the balance effect of a deleted transaction and remove the record.

#### Scenario: Delete an expense
- **WHEN** a user deletes an `EXPENSE` of 5,000,000
- **THEN** `availableCredit` increases by 5,000,000

#### Scenario: Delete a payment
- **WHEN** a user deletes a `PAYMENT` of 10,000,000
- **THEN** `availableCredit` decreases by 10,000,000

### Requirement: Manual reconciliation resets the available credit baseline
The system SHALL provide a reconciliation endpoint that sets `availableCredit` to a user-supplied value and records a `lastReconciledAt` timestamp. An `ADJUSTMENT` transaction is created to document the change.

#### Scenario: Reconcile to a specific value
- **WHEN** a card has `availableCredit` 55,000,000 and the user reconciles to 62,000,000
- **THEN** `availableCredit` becomes 62,000,000, `lastReconciledAt` is updated, and an `ADJUSTMENT` transaction of +7,000,000 is recorded without applying that delta again

#### Scenario: Transactions after reconciliation apply on new baseline
- **WHEN** the user reconciles to 62,000,000 then records an `EXPENSE` of 2,000,000
- **THEN** `availableCredit` becomes 60,000,000

### Requirement: Editing or deleting transactions across a reconciliation boundary follows defined rules
The system SHALL prevent modification or deletion of transactions that were created before the most recent reconciliation, because those transactions are already reflected in the reconciled baseline.

#### Scenario: Edit a pre-reconciliation transaction
- **WHEN** a user attempts to edit a transaction whose `createdAt` is before the card's `lastReconciledAt`
- **THEN** the system rejects the edit with an error explaining that the transaction predates the last reconciliation

#### Scenario: Delete a post-reconciliation transaction
- **WHEN** a user deletes a transaction created after the last reconciliation
- **THEN** the deletion proceeds normally and `availableCredit` is adjusted

### Requirement: Transaction listing for a card
The system SHALL provide a paginated list of transactions for a given card, ordered by transaction date descending, accessible only to the card owner.

#### Scenario: List transactions with pagination
- **WHEN** a user requests transactions for their card
- **THEN** the response contains a paginated list of transactions ordered by `transactionDate` descending, with each entry showing type, amount (decimal string), date, description, and merchant

#### Scenario: Transactions of a deleted card are not accessible
- **WHEN** a user requests transactions for a soft-deleted card through the standard endpoint
- **THEN** the system returns a not-found response

### Requirement: All transaction operations enforce card ownership
The system SHALL verify that the authenticated user owns the card associated with every transaction operation.

#### Scenario: Create transaction on another user's card
- **WHEN** a user attempts to create a transaction on a card they do not own
- **THEN** the system returns a not-found error without creating the transaction
