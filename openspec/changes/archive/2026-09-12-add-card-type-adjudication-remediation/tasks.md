## 1. Establish Active Remediation Change

- [x] 1.1 Create the active `2026-09-12-add-card-type-adjudication-remediation` change with proposal, design, current-spec deltas, and this task ledger; verify `openspec status --change 2026-09-12-add-card-type-adjudication-remediation --json` reports all required artifacts present.
- [x] 1.2 Record RA-004's compact logo-sizing scope and acceptance criteria in the active artifacts; verify the design and implementation task cover known-logo, fallback, compact 20×13, and default 32×20 behavior.
- [x] 1.3 Record RA-008's singular card-type validation scope and acceptance criteria in the active artifacts; verify the design and implementation task distinguish required, unsupported, and supported values.

## 2. Correct Current Specification Ownership and Wording

- [x] 2.1 Amend the live `credit-card-crud` legacy-card response scenario to require an explicit `cardType: null` property while retaining typed values and legacy editability; verify the current service and dashboard response tests still assert null preservation.
- [x] 2.2 Amend the live `credit-card-crud` create and update requirements so `cardType` is required on create and optional on update, including the missing/unsupported create validation example and card-type-only partial update; verify `openspec validate --specs --strict` passes.
- [x] 2.3 Move the two card-form selector scenarios from the live `dashboard-overview` branding requirement into `credit-card-crud` with unchanged WHEN/THEN behavior; verify each scenario appears once in the owning current specification and both specs pass strict validation.

## 3. Restore Parameterized Card-Type Logo Sizing

- [x] 3.1 Remove fixed logo dimensions, apply the computed 5:8 dimensions to known and fallback paths, and constrain the fallback icon to its box; extend focused tests for known and fallback `size={20}` (20×13) plus default (32×20) behavior, then verify the logo and card-form Jest suites pass.

## 4. Make Create-Card Validation Singular and Accurate

- [x] 4.1 Replace duplicate create-card type validators with one value-aware enum validator that emits one required message for undefined, null, or empty input and one invalid message for unsupported input; extend DTO tests to assert exact constraints/messages and supported success, then verify the focused DTO suite, backend lint, and backend typecheck pass.
