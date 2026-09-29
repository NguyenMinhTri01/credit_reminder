## Why

Two accepted review findings expose inconsistencies between the money-input display and card balance contracts. A metadata-only card edit can accidentally normalize stored limit cents and recalculate available credit, while reconciliation rejects an unchanged negative available-credit value that the system otherwise permits.

## What Changes

- Preserve stored `creditLimit` cents during metadata-only edits by omitting the displayed, rounded limit from the update payload unless its whole-đồng value changed.
- Allow reconciliation to submit an unchanged negative available-credit value hydrated from the stored balance.
- Clarify both behaviors in the credit-card CRUD and available-credit specifications.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-crud`: metadata-only edits preserve stored fractional limit cents when the form displays a rounded whole-đồng value.
- `credit-card-available-credit`: reconciliation accepts an unchanged negative stored balance.

## Impact

- Frontend card editing and reconciliation forms.
- Credit-card CRUD and available-credit OpenSpec requirements.
