# Review Adjudication and Remediation Plan

- Report status: PROPOSED — no fixes applied
- User implementation decision: PENDING / no `ACCEPTED_FIX` items selected
- Adjudication coverage: COMPLETE — limited to the eight supplied review comments
- Review source: User-provided Review 1 and Review 2, 2026-09-12
- Repository / branch: `credit_reminder` / `feat/card-type-selection-and-logos`
- Reviewed revision / current HEAD: `3958ed62612996c9e44a5abd9969b57ec7899ff4`
- Diff base and working-tree scope: No PR base was provided. Review targets current files. Existing
  unrelated modifications: `frontend/public/images/banks/hsbc.svg`,
  `frontend/public/images/banks/mbbank.svg`; untracked `review.md`.
- OpenSpec root / store: local `/Users/Shared/workspace/credit_reminder`; no store
- Change / lifecycle / schema: `2026-09-12-add-card-type`; archived; `spec-driven`; no active
  changes were returned by `openspec list --json`
- Artifacts and standards read: `AGENTS.md`, `openspec/config.yaml`, archived proposal/design/tasks
  and both archived delta specs, current `credit-card-crud` and `dashboard-overview` specs, affected
  source and tests, and `openspec-review-change` finding-code guidance
- Structural-analysis method: CodeGraph was unavailable in this session; targeted source inspection
  was used instead.
- Language policy: English repository artifact; Vietnamese conversational summary; no override

### Decision summary

Six comments identify current behavior or current-contract problems worth correcting in a new active
OpenSpec change. The archived requirement and archived task comments are not implementation defects:
the former is historical wording, while the latter requests an unnecessary rewrite of a completed task.

| ID | Original IDs | Claim | Affected feature | Decision | Severity | Why / next action |
| --- | --- | --- | --- | --- | --- | --- |
| RA-001 | R1 inline 1; R2 archive spec 1 | Archive should require `cardType: null` | Archived delta | INFORMATIONAL_NOTE | N/A | Historical wording is loose, but archives are immutable; current contract is handled by RA-002. |
| RA-002 | R1 inline 2 | Main spec permits an absent legacy field | API response contract | ACCEPTED_FIX | RECOMMEND | Current mapper always emits the nullable field; clarify the live spec. |
| RA-003 | R1 nitpick 1 | Archive task must name `mapCardToResponse` | Archived task ledger | REJECTED_OVER_ENGINEERING | N/A | The completed task already covers mapping; naming a private helper would rewrite history without changing a contract. |
| RA-004 | R2 `card-type-logo.tsx:41` | `size={20}` is overridden by fixed CSS dimensions | Card-form logo rendering | ACCEPTED_FIX | MUST FIX | The compact trigger and options render a 32×20 box despite their requested 20×13 size. |
| RA-005 | R2 `credit-card-crud/spec.md:168` (create) | Create-field lists omit required `cardType` | Create-card contract | ACCEPTED_FIX | RECOMMEND | “All required fields” conflicts with the later `cardType` requirement. |
| RA-006 | R2 `credit-card-crud/spec.md:168` (update) | Metadata-field list omits optional `cardType` | Update-card contract | ACCEPTED_FIX | RECOMMEND | The metadata list conflicts with the later optional card-type update scenario. |
| RA-007 | R2 `dashboard-overview/spec.md:114` | Form scenarios belong to CRUD, not dashboard | Spec ownership | ACCEPTED_FIX | RECOMMEND | The scenarios govern `/cards` form behavior and fit the CRUD capability. |
| RA-008 | R2 `create-credit-card.dto.ts:40` | Missing `cardType` returns duplicate validation messages | Create-card validation | ACCEPTED_FIX | RECOMMEND | Both validators fail for an omitted value; preserve distinct required/invalid wording with one constraint. |

- Input findings: 8; normalized findings: 8; duplicate/split mapping: RA-001 merges the two identical
  archived-spec comments; the compound create/update comment is split into RA-005 and RA-006.
- ACCEPTED_FIX: 6
- REJECTED_FALSE_POSITIVE: 0
- REJECTED_OVER_ENGINEERING: 1
- DEFERRED_OUT_OF_SCOPE: 0
- INFORMATIONAL_NOTE: 1
- NEEDS_EVIDENCE: 0

### OpenSpec scope and traceability

- In scope: the archived proposal's card-type persistence, create/update validation, legacy-safe
  response, shared logo, and card-form changes. Current remediation restores or clarifies those
  intended behaviors without expanding card-type values or adding APIs.
- Out of scope: rewriting archived artifacts, changing existing SVG assets, or adding dependencies.
- Binding decisions and contract conflicts: archived design decisions 2–5 require create validation,
  shared form branding, a stable response mapper, and null preservation. The current main CRUD spec
  conflicts internally by requiring `cardType` while calling its legacy presence “absent-safe.”

| Finding | Capability / spec path | Requirement → scenario | Proposal / design basis | Existing task | Contract effect |
| --- | --- | --- | --- | --- | --- |
| RA-002 | `credit-card-crud` | Card type is exposed with legacy-safe card responses → Legacy card without a type is returned | Proposal “Return `cardType`”; design decision 5 | Archived 1.4 only; no active task | Clarifies the implemented response shape. |
| RA-004 | `credit-card-crud` | Card type branding is displayed consistently → Card type selector displays matching logos | Proposal card-form/logo bullets; design decisions 3–4 | Archived 2.2, 2.4 only; no active task | Restores compact selector sizing. |
| RA-005 | `credit-card-crud` | User can create a credit card → Successful card creation with all required fields | Proposal requires `cardType` on create; design decision 2 | Archived 1.3, 2.3 only; no active task | Clarifies an existing requirement. |
| RA-006 | `credit-card-crud` | User can update card metadata → Update a card type | Proposal optional updates; design decision 2 | Archived 1.3 only; no active task | Clarifies an existing requirement. |
| RA-007 | `credit-card-crud`, `dashboard-overview` | Card type branding → two selector scenarios | Proposal maps form work to CRUD and dashboard card presentation to dashboard | Archived 2.3, 2.4 only; no active task | Moves existing scenarios without changing behavior. |
| RA-008 | `credit-card-crud` | Credit card type is controlled and persisted → Create a card without a card type | Proposal requires API-boundary validation; design decision 2 | Archived 1.3 only; no active task | Preserves rejection while making its message singular and accurate. |

### Accepted findings — recommended for fixing

#### RA-002 — Current legacy response contract allows an absent field

- Decision: ACCEPTED_FIX
- Original finding: R1 inline comment at `openspec/specs/credit-card-crud/spec.md:195` requests an
  explicit `cardType: null` response field for legacy cards.
- Reviewer severity / adjudicated severity: unspecified / RECOMMEND. This is a contract-documentation
  ambiguity rather than a runtime failure.
- Project finding code: `[OS-DOC-DRIFT]` — current requirement wording does not fully describe the
  shipped response shape.
- Affected feature and impact: card detail, list, create, update, restore, and dashboard consumers
  need a stable, nullable `cardType` key.
- Origin: introduced with the archived card-type change; the archived wording was synced into the
  current spec.
- Trigger / reproduction: read the current requirement at `openspec/specs/credit-card-crud/spec.md:187`
  and its legacy scenario at `:193–195`; the latter permits “null or absent-safe” even though the
  former says all payloads include the field.
- Expected behavior: every card payload has a `cardType` property; legacy cards use `null`.
- Actual behavior: `CreditCardsService.mapCardToResponse` explicitly assigns `cardType: card.cardType`
  at `backend/src/credit-cards/credit-cards.service.ts:74–79`, and the dashboard mapper normalizes it
  to `null` at `backend/src/dashboard/dashboard.service.ts:82–90`. The spec still permits absence.
- Evidence: `CreditCardResponseDto.cardType` is nullable, not optional, at
  `backend/src/credit-cards/dto/credit-card-response.dto.ts:29–38`; legacy response tests assert null
  at `backend/src/credit-cards/credit-cards.service.spec.ts:419–423` and
  `backend/src/dashboard/dashboard.service.spec.ts:224–249`.
- Counter-evidence considered: a missing field would be safe for existing UI callers, but that does
  not make it a stable API shape and contradicts the requirement's “SHALL include” wording.
- Why fixing is necessary: client contracts should not have two legal payload shapes when the
  implementation and DTO already guarantee one.
- Scope basis: restores the archived proposal's explicit response-field intent without changing code.
- Reviewer remedy assessment: use the intent for the current main spec only. Do not change the
  archived delta; see RA-001.
- Minimal remediation: replace “null or absent-safe card type” with a requirement that the response
  includes `cardType: null` and does not fail for legacy cards.
- Compatibility and non-goals: retain `null` for legacy records; do not migrate data or alter API
  behavior.
- Dependencies / order: establish an active OpenSpec change before editing current specs.
- OpenSpec integration: no active task exists. Add a linked specification-correction task in a new
  active change; no delta is needed for runtime code.
- Acceptance criteria:
  - WHEN a legacy card has no stored type, THEN each documented response includes `cardType: null`.
  - WHEN a typed card is returned, THEN its stored enum value remains unchanged.
- Regression verification: retain the existing service/dashboard null assertions; run their focused
  backend suites.
- Plan task IDs: 1.1, 2.1

#### RA-004 — `CardTypeLogo` ignores its compact size input

- Decision: ACCEPTED_FIX
- Original finding: R2 `frontend/src/components/cards/card-type-logo.tsx:41` reports that fixed
  `h-5 w-8` utilities override `size={20}`.
- Reviewer severity / adjudicated severity: P2 / MUST FIX. The form deliberately requests compact
  dimensions, but the rendered controls ignore that input.
- Project finding code: N/A — implementation behavior beyond a named OpenSpec scenario.
- Affected feature and impact: selected card-type trigger and every option in `/cards` create/edit
  forms call the component with `size={20}`.
- Origin: introduced by the archived card-type branding change.
- Trigger / reproduction: render a known or fallback `CardTypeLogo` with `size={20}`. The calculated
  dimensions are 20×13, but `h-5 w-8` imposes a 32×20 CSS box.
- Expected behavior: both known-logo and fallback render paths honor the requested size and derived
  aspect-ratio height.
- Actual behavior: `card-type-logo.tsx:20` calculates `height`, but its fallback at `:24–31` and
  image at `:36–43` always use `h-5 w-8`. CSS utility dimensions override image attributes; the
  image's `object-contain` only constrains content inside that larger box.
- Evidence: compact callers are at `frontend/src/components/cards/card-form.tsx:416` and `:426`.
  Current logo tests at `card-type-logo.test.tsx:17–52` cover mapping and errors but not dimensions.
- Counter-evidence considered: default callers intend the 32×20 design size, and will retain it
  because the default `size` is 32.
- Why fixing is necessary: form controls have inconsistent visual density and the public `size` prop
  is ineffective for non-default inputs.
- Scope basis: restores the compact selector behavior included in the archived proposal/design.
- Reviewer remedy assessment: remove fixed outer sizing and size both outer render paths from the
  existing `size`/`height` values. Also ensure the fallback icon remains within a reduced fallback
  box; the review's outer-box-only advice does not address that detail.
- Minimal remediation: preserve `shrink-0` and `object-contain`; remove `h-5 w-8`; apply dynamic
  image and fallback dimensions; size or clamp the fallback icon to fit; add normal and error-path
  `size={20}` assertions.
- Compatibility and non-goals: preserve default 32×20 behavior, labels, logo mapping, and fallback
  semantics; do not alter SVG assets or selector options.
- Dependencies / order: independent of the contract wording corrections.
- OpenSpec integration: new active change task, linked to the existing card-branding scenario.
- Acceptance criteria:
  - WHEN `CardTypeLogo` receives `size={20}`, THEN known logos and fallbacks occupy 20×13 boxes.
  - WHEN no `size` is supplied, THEN the default layout remains 32×20.
  - WHEN a logo fails to load, THEN the compact fallback remains accessible and fits its box.
- Regression verification: extend `frontend/src/components/cards/card-type-logo.test.tsx`; run its
  focused Jest suite and the card-form suite.
- Plan task IDs: 1.2, 3.1

#### RA-005 — Create-card field lists contradict the required card type

- Decision: ACCEPTED_FIX
- Original finding: R2 `openspec/specs/credit-card-crud/spec.md:168` says the earlier creation
  requirement and “all required fields” scenario omit `cardType`.
- Reviewer severity / adjudicated severity: P2 / RECOMMEND. This is an internal-spec ambiguity.
- Project finding code: `[OS-DOC-DRIFT]`.
- Affected feature and impact: consumers reading the basic card-creation contract can believe a
  payload without `cardType` is complete.
- Origin: introduced when the archived delta was synchronized into the main CRUD specification.
- Trigger / reproduction: compare `credit-card-crud/spec.md:20–25` with `:167–176`.
- Expected behavior: all required-fields text and validation examples name `cardType`.
- Actual behavior: one scenario calls its enumerated field set “all required fields,” then later
  states that `cardType` MUST be present.
- Evidence: archive proposal line 8 and design decision 2 require create-time card type; frontend
  form test `card-form.test.tsx:263–287` and DTO validation enforce it.
- Counter-evidence considered: later scenarios make the actual rule discoverable, but they do not
  resolve the contradiction in the prior exhaustive wording.
- Why fixing is necessary: this is the most likely location for API consumers to derive a create
  request shape.
- Scope basis: clarifies an already implemented requirement; no feature expansion.
- Reviewer remedy assessment: add `cardType` to both the creation requirement and its complete-field
  scenario; retain optional `cardName` and expiry semantics.
- Minimal remediation: update the creation sentence, required-field list, and invalid-input scenario
  to name missing/unsupported card types alongside existing validation examples.
- Compatibility and non-goals: no change to mandatory fields, DTO behavior, or persistence.
- Dependencies / order: update with RA-006 in one current-spec correction.
- OpenSpec integration: new active change task; source changes are unnecessary.
- Acceptance criteria:
  - WHEN the creation scenario lists all required fields, THEN it includes `cardType`.
  - WHEN validation examples are read, THEN missing `cardType` is explicitly rejected.
- Regression verification: `openspec validate --specs --strict`; existing create DTO/form tests remain
  the behavior proof.
- Plan task IDs: 1.1, 2.2

#### RA-006 — Update metadata field list contradicts optional card-type updates

- Decision: ACCEPTED_FIX
- Original finding: R2 `openspec/specs/credit-card-crud/spec.md:168` also identifies the earlier
  metadata-field list as omitting `cardType`.
- Reviewer severity / adjudicated severity: P2 / RECOMMEND.
- Project finding code: `[OS-DOC-DRIFT]`.
- Affected feature and impact: API clients and maintainers need the supported partial-update surface
  to include an optional card type.
- Origin: introduced by the same current-spec synchronization as RA-005.
- Trigger / reproduction: compare the metadata list at `credit-card-crud/spec.md:62–75` with the
  optional update rule and scenario at `:167–184`.
- Expected behavior: the general update requirement names `cardType` as an optional metadata field.
- Actual behavior: the list appears exhaustive while a later requirement permits the missing field.
- Evidence: `CreditCardsService.update` conditionally persists `dto.cardType` at
  `backend/src/credit-cards/credit-cards.service.ts:240–262`; update DTO tests cover accepted and
  rejected type values at `credit-cards-dto.spec.ts:210–218`.
- Counter-evidence considered: a reader could infer the later specialized requirement supplements
  the list, but the current phrasing makes that inference unnecessarily uncertain.
- Why fixing is necessary: a single update contract prevents accidental omission in generated clients
  or later changes.
- Scope basis: wording correction for a shipped partial-update behavior.
- Reviewer remedy assessment: add `cardType` to the metadata list with an explicit optional qualifier;
  retain the no-reconciliation guarantee for the other metadata fields.
- Minimal remediation: amend the update requirement and partial-update scenario to show a supported
  card-type-only request as valid.
- Compatibility and non-goals: do not make `cardType` required on update or permit null.
- Dependencies / order: update with RA-005 in one current-spec correction.
- OpenSpec integration: new active change task; source changes are unnecessary.
- Acceptance criteria:
  - WHEN updateable metadata is enumerated, THEN `cardType` appears as optional.
  - WHEN a card type is updated, THEN the existing validation and response behavior is unchanged.
- Regression verification: `openspec validate --specs --strict` and the existing update DTO/service
  tests.
- Plan task IDs: 1.1, 2.2

#### RA-007 — Card-form scenarios are owned by the dashboard specification

- Decision: ACCEPTED_FIX
- Original finding: R2 `openspec/specs/dashboard-overview/spec.md:114` asks to move the two card-form
  scenarios to the CRUD specification.
- Reviewer severity / adjudicated severity: P2 / RECOMMEND. The issue is documentation ownership,
  not a runtime defect.
- Project finding code: `[OS-DOC-DRIFT]`.
- Affected feature and impact: create/edit card form selection, validation, and option-logo behavior.
- Origin: the archived dashboard delta included both selector scenarios at
  `openspec/changes/archive/2026-09-12-add-card-type/specs/dashboard-overview/spec.md:22–30`.
- Trigger / reproduction: current `dashboard-overview/spec.md:112–118` defines `/cards` create/edit
  form behavior, while the CRUD spec already owns card creation, updates, validation, and its bank
  selector form UI.
- Expected behavior: CRUD owns create/edit-form contracts; dashboard owns dashboard card rendering.
- Actual behavior: the main dashboard spec mixes dashboard presentation with two form scenarios.
- Evidence: the archived proposal assigns card creation/update/validation to `credit-card-crud` and
  only dashboard card entries/UI to `dashboard-overview` at `proposal.md:23–26`; design decision 3
  describes the form and decision 4 describes shared branding.
- Counter-evidence considered: the dashboard requirement's “any card selector” language explains why
  the scenarios were added, but it does not make the form a dashboard behavior.
- Why fixing is necessary: colocating form requirements avoids future divergence between CRUD API,
  form validation, and selector rendering requirements.
- Scope basis: moves unchanged behavior to its owning capability without extending the product.
- Reviewer remedy assessment: move both scenarios verbatim into the CRUD card-type requirement, then
  remove them from dashboard; do not duplicate or alter their observable behavior.
- Minimal remediation: transfer “Card form exposes only supported types” and “Card type selector
  displays matching logos” from dashboard to CRUD, preserving the two current scenarios.
- Compatibility and non-goals: retain all dashboard card-label/logo scenarios and all test locations;
  no implementation change is required.
- Dependencies / order: make this transfer with RA-005/RA-006 in the new specs-only change.
- OpenSpec integration: new active change needs modifications to both current main specs.
- Acceptance criteria:
  - WHEN the CRUD spec is read, THEN it contains both create/edit selector scenarios.
  - WHEN the dashboard spec is read, THEN it retains dashboard rendering/fallback scenarios only.
  - WHEN both specs are validated, THEN no behavior is duplicated or lost.
- Regression verification: `openspec validate --specs --strict`; existing card-form tests remain the
  runtime proof.
- Plan task IDs: 1.1, 2.3

#### RA-008 — Missing card type produces duplicate validation messages

- Decision: ACCEPTED_FIX
- Original finding: R2 `backend/src/credit-cards/dto/create-credit-card.dto.ts:40` reports that
  `@IsNotEmpty` and `@IsEnum` both fail for an omitted value.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. The endpoint rejects correctly, but its
  field-level response is redundant and has a confusing invalid-value message for an absence.
- Project finding code: N/A — this does not violate a specified rejection behavior.
- Affected feature and impact: `POST /api/v1/credit-cards` returns two messages for one missing form
  field, making field-level client rendering and accessibility announcements noisy.
- Origin: introduced with create-time card-type validation.
- Trigger / reproduction: validate an otherwise valid `CreateCreditCardDto` with no `cardType`.
- Expected behavior: one field-level error distinguishes a missing value from an unsupported value.
- Actual behavior: `@IsNotEmpty` and `@IsEnum` at
  `backend/src/credit-cards/dto/create-credit-card.dto.ts:40–41` both fail under installed
  `class-validator` 0.14.4. The default `ValidationPipe` at `backend/src/main.ts:12–18` reports both
  constraints.
- Evidence: current DTO test at `credit-cards-dto.spec.ts:43–55` only asserts an error exists.
  Direct validation returns `isEnum` and `isNotEmpty` constraints for `cardType`; the focused DTO
  suite passes without detecting the duplicate.
- Counter-evidence considered: removing `@IsNotEmpty` alone leaves one error, but it incorrectly tells
  clients that an omitted field has an unsupported enum value. The reviewer's proposed deletion of
  `CARD_TYPE_REQUIRED` is therefore not sufficient.
- Why fixing is necessary: a required field should have one accurate message, while malformed values
  retain the current enum-specific message.
- Scope basis: improves the existing field-level validation contract without expanding it.
- Reviewer remedy assessment: replace the two decorators with one enum constraint that dynamically
  selects `CARD_TYPE_REQUIRED` for `undefined`, `null`, or empty values and `CARD_TYPE_INVALID` for
  other values. Retain both constants.
- Minimal remediation: remove `@IsNotEmpty`; provide a typed `@IsEnum` message callback based on the
  submitted value; extend DTO tests to assert exactly one constraint and the correct message for
  missing, empty, null, and unsupported inputs.
- Compatibility and non-goals: preserve the HTTP 400 rejection, supported enum set, Swagger metadata,
  and invalid-value message; do not add global `stopAtFirstError` behavior.
- Dependencies / order: independent of the specs-only corrections.
- OpenSpec integration: add a linked implementation task to a new active change because it changes
  observable validation-message quality.
- Acceptance criteria:
  - WHEN `cardType` is omitted, null, or empty, THEN validation returns one required-field message.
  - WHEN `cardType` is unsupported, THEN validation returns one invalid-enum message.
  - WHEN `cardType` is supported, THEN validation succeeds unchanged.
- Regression verification: extend `backend/src/credit-cards/dto/credit-cards-dto.spec.ts`; run its
  focused Jest suite and backend typecheck/lint.
- Plan task IDs: 1.3, 4.1

### Findings not scheduled for fixing

#### RA-001 — Archived legacy response wording

- Decision: INFORMATIONAL_NOTE
- Original finding: R1 inline comment and R2 archived-spec comment at
  `openspec/changes/archive/2026-09-12-add-card-type/specs/credit-card-crud/spec.md:39` ask to change
  “null or absent-safe” to an explicit null field.
- Adjudicated severity / project code: N/A / N/A. The wording is less precise than the live contract,
  but it is an archived historical delta.
- Affected feature and actual behavior: the current service and dashboard mappers emit `cardType`; a
  legacy value is represented as null.
- Evidence and contract basis: archived design decision 5 requires null preservation; current source
  implements it. Current main spec is separately scheduled as RA-002.
- Independent reasoning: editing an archived delta would rewrite an approved historical record.
  Consumers should use current main specs, and the live wording will be corrected through a new
  active change.
- Consequence of leaving unchanged: only historical-reading ambiguity; no runtime behavior or current
  source-of-truth contract remains unaddressed.
- Disposition: no archive edit; fix the current main spec under RA-002.
- Reconsider only if: project policy explicitly authorizes archival corrections with a documented
  provenance mechanism.

#### RA-003 — Archived task must name the restore mapper

- Decision: REJECTED_OVER_ENGINEERING
- Original finding: R1 nitpick requests that archived task 1.4 explicitly name
  `CreditCardsService.restore` and private `mapCardToResponse`.
- Adjudicated severity / project code: N/A / N/A.
- Affected feature and actual behavior: `restore` returns `mapCardToResponse(restoredCard, ...)` at
  `backend/src/credit-cards/credit-cards.service.ts:292–297`, so the response already includes the
  mapped `cardType` field.
- Evidence and contract basis: archived task 1.4 already claims propagation through credit-card
  create/update/read and dashboard response mapping; the archived requirement explicitly includes
  restore payloads.
- Independent reasoning: the task is complete, its observable contract is met, and a private-helper
  name does not add verification value. Rewriting a completed archive for this implementation detail
  creates churn rather than accuracy.
- Consequence of leaving unchanged: none; current code and response contract remain verifiable.
- Disposition: no change.
- Reconsider only if: restore stops using the shared mapper or the project introduces a policy for
  amending completed archive task evidence.

### Unresolved findings and decisions

None. Every supplied finding has sufficient current-code and specification evidence for a decision.

## 1. Establish an active remediation change

- [ ] 1.1 [RA-002, RA-005, RA-006, RA-007] Create a narrowly scoped active OpenSpec change for the
  current-spec contract corrections; verify proposal/design/tasks distinguish clarification and
  scenario relocation from runtime behavior changes.
- [ ] 1.2 [RA-004] Add the compact-size logo fix and focused rendering assertions to the active
  change; verify known and fallback 20×13 rendering while default rendering remains 32×20.
- [ ] 1.3 [RA-008] Add the single, accurate card-type validation-message change and DTO regression
  cases to the active change; verify missing and unsupported values remain distinct.

## 2. Correct current specification ownership and wording

- [ ] 2.1 [RA-002] Amend the live legacy-card response scenario to require the explicit nullable
  field; verify current service and dashboard null assertions still match the contract.
- [ ] 2.2 [RA-005, RA-006] Amend create/update required-field wording and scenarios; verify
  `cardType` is required on create and optional on update without changing other field semantics.
- [ ] 2.3 [RA-007] Move the two selector scenarios from dashboard-overview to credit-card-crud with
  unchanged WHEN/THEN behavior; verify no scenario is duplicated or removed.

## 3. Restore parameterized logo sizing

- [ ] 3.1 [RA-004] Remove fixed outer size utilities, apply computed dimensions to known and fallback
  paths, and keep the fallback icon within its box; verify the focused logo and card-form tests.

## 4. Make create-card validation singular and accurate

- [ ] 4.1 [RA-008] Replace duplicate validators with one enum validator that selects required versus
  invalid messages by submitted value; verify focused DTO tests, backend lint, and backend typecheck.

### Verification evidence and future checks

| Check | Phase | Command / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- | --- |
| Logo tests | Adjudication | `pnpm --filter frontend test -- src/components/cards/card-type-logo.test.tsx --runInBand` | PASS | 1 suite, 7 tests; does not assert non-default dimensions. |
| DTO tests | Adjudication | `pnpm --filter backend test -- src/credit-cards/dto/credit-cards-dto.spec.ts --runInBand` | PASS | 1 suite, 23 tests; omission case does not assert constraints/messages. |
| Current spec structure | Adjudication | `openspec validate --specs --strict` | PASS | 6 specs passed; one existing long-requirement informational notice. |
| Current spec structure | Future implementation | `openspec validate <new-change> --strict` | NOT RUN | Validates planned artifact structure, not runtime behavior. |
| Frontend regression | Future implementation | Focused logo/card-form Jest suites, frontend lint, and typecheck | NOT RUN | Verify compact known/fallback rendering and unchanged selector options. |
| Backend regression | Future implementation | Focused DTO suite, backend lint, and typecheck | NOT RUN | Verify one accurate validation message for each invalid input class. |

### Handoff instructions for the implementing agent

1. Read this report, `AGENTS.md`, `openspec/config.yaml`, the archived change for history, current
   main specs, and current code. Revalidate every accepted finding if HEAD or the working tree changed.
2. Implement only accepted findings the user selects. “Fix the issues in this report” selects
   RA-002 and RA-004 through RA-008; it does not authorize changes for RA-001 or RA-003.
3. Because `openspec list --json` shows no active change, use `openspec-propose` to create a narrow
   active change before editing current specs or production code. Do not edit
   `openspec/changes/archive/2026-09-12-add-card-type/`.
4. Map the approved tasks above into the new change's authoritative `tasks.md`, preserving this
   report's RA IDs. Use spec deltas only where the live contract changes; scenario relocation must
   preserve observable behavior.
5. Apply the minimal implementation and test changes described above. Do not modify bank SVG assets,
   add dependencies, or change the card-type enum/value set.
6. Run the listed checks, record actual results, and complete authoritative tasks only after their
   acceptance criteria pass.

### Decisions requested from the user

- Select any subset of RA-002 and RA-004 through RA-008 for implementation, or approve all six.
- No code or existing OpenSpec artifact changes were made during this adjudication.
