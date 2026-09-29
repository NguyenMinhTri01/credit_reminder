## Why

The accepted findings in the September 28 and September 29 adjudication reports identify money-input regressions that can mutate or clear a user's value during rejected edits, mis-handle deletion before a stored negative sign, or leave the caret at the wrong position after a rejected paste. The transaction edit test also bypasses required type checking with an incomplete fixture.

## What Changes

- Preserve hydrated negative amounts when an edit contributes no valid amount digits, while retaining explicit sign removal and normal digit-edit behavior.
- Keep the existing amount when a selected value is replaced only with invalid text, while preserving explicit clearing.
- Restore the edit selection after rejecting an over-wide paste and limit Delete redirection to grouping commas.
- Replace the partial transaction test fixture with a complete `ITransaction` value.
- When whole-đồng rounding of a valid stored amount would exceed the 13-digit input limit, cap the display to the largest storable whole amount, `9,999,999,999,999`, and accept normalization of the stored cents.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-crud`: Clarify negative-value no-op edits, invalid selection replacement, caret restoration for rejected over-wide pastes, Delete immediately before a leading minus sign, and normalization at the maximum whole-đồng display boundary.

## Impact

- Frontend `MoneyInput` behavior and its component tests.
- The transaction form test fixture and frontend type checking.
- No API, persistence, or dependency changes.

The user selected maximum-whole-amount normalization for the `DECIMAL(15, 2)` display boundary on 2026-09-29. The separate unresolved findings about metadata-only credit-limit normalization and submitting an untouched negative reconciliation value remain out of scope. Informational archive inconsistencies will not be edited.
