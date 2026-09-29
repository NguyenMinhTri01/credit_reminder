## MODIFIED Requirements

### Requirement: Manual reconciliation resets the available credit baseline
The system SHALL provide a reconciliation endpoint that sets `availableCredit` to a user-supplied value and records a `lastReconciledAt` timestamp. An `ADJUSTMENT` transaction is created to document the change.

#### Scenario: Reconcile to a specific value
- **WHEN** a card has `availableCredit` 55,000,000 and the user reconciles to 62,000,000
- **THEN** `availableCredit` becomes 62,000,000, `lastReconciledAt` is updated, and an `ADJUSTMENT` transaction of +7,000,000 is recorded without applying that delta again

#### Scenario: Reconcile an unchanged negative available-credit balance
- **WHEN** a card has a negative `availableCredit` such as `"-2500000.00"` and the user submits reconciliation without editing the hydrated value
- **THEN** the form submits the same negative canonical value and the reconciliation records no balance change

#### Scenario: Transactions after reconciliation apply on new baseline
- **WHEN** the user reconciles to 62,000,000 then records an `EXPENSE` of 2,000,000
- **THEN** `availableCredit` becomes 60,000,000
