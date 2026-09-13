## Why

Legacy cards can have a nullable `cardType`, but the card form currently renders only the select placeholder when such a card is edited. This leaves the trigger without the generic visual and unavailable label promised for missing card types, so the live contract and the UI are inconsistent.

## What Changes

- Specify a safe fallback for a missing or unrecognized card type in the card-form trigger.
- Render the compact generic card-type visual and unavailable label for legacy card-type values while preserving normal selection behavior.
- Add a regression test for editing a legacy card with `cardType: null`.
- Update the completed adjudication plan so its status, verification, and repository-path wording are accurate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-crud`: Clarify the card-form fallback behavior for missing or unrecognized card types.

## Impact

- `frontend/src/components/cards/card-form.tsx` and its focused tests.
- `openspec/specs/credit-card-crud/spec.md` and its delta specification.
- `docs/reviews/2026-09-12-add-card-type-adjudication-plan.md` documentation status and path metadata.
- No API, database, dependency, enum, or asset changes.
