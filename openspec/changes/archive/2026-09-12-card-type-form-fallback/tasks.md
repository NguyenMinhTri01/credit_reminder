## 1. Contract and Review Record

- [x] 1.1 Update the live `credit-card-crud` card-form requirement with an explicit missing/unrecognized card-type fallback scenario; verify the delta passes strict OpenSpec validation.
- [x] 1.2 Update `docs/reviews/2026-09-12-add-card-type-adjudication-plan.md` to record the prior remediation as implemented and archived, mark its verification evidence complete, and replace the machine-specific absolute repository path with a repository-root description; verify no stale `PROPOSED`, `PENDING`, or `NOT RUN` status remains for completed remediation.

## 2. Card-Form Fallback Implementation

- [x] 2.1 Render the existing generic `CardTypeLogo` fallback and unavailable label in an edit form when `cardType` is missing or unrecognized, while preserving the create-form placeholder and supported selections; verify the focused card-form test passes.
- [x] 2.2 Add regression coverage for a legacy edit form with `cardType: null`, asserting the compact fallback visual and unavailable label; verify the card-form and card-type-logo Jest suites pass.

## 3. Verification

- [x] 3.1 Run `openspec validate --specs --strict`, frontend lint, and frontend typecheck; verify all changed specs and source pass without errors.
