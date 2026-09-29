# Review Adjudication and Remediation Plan

- Report status: PROPOSED — no fixes applied
- User implementation decision: PENDING — no accepted finding has been authorized for implementation
- Adjudication coverage: COMPLETE — limited to the 11 supplied findings and directly related behavior
- Review source: User attachment at /Users/nguyenminhtri/.codex/attachments/2de0fe73-560c-49a9-b1a0-1bd7c8903c35/Pasted text.txt; supplied 2026-09-29; source IDs are file-scoped violation numbers
- Repository / branch: /Users/Shared/workspace/credit_reminder / fix/price-input-issue
- Reviewed revision / current HEAD: 51e8665270a60c30d550fd1c42712f06b7704915
- Diff base and working-tree scope: origin/main at 50556e6bc8d910a6040337e972f5b62aeecf76f2; merge-base matches origin/main; 22 committed files differ from the base (+1369/-133). No staged or modified tracked files. Pre-existing untracked paths: docs/reviews/2026-09-28-fix-money-input-ux-money-input-findings-adjudication-plan.md and ytuong.md; both were preserved.
- OpenSpec root / store: /Users/Shared/workspace/credit_reminder/openspec; nearest local root; no external store
- Change / lifecycle / schema: 2026-09-28-fix-money-input-ux / archived / spec-driven; openspec list reports no active changes
- Artifacts and standards read: AGENTS.md; openspec/config.yaml; archived proposal.md, design.md, tasks.md, .openspec.yaml, and both delta specs for 2026-09-28-fix-money-input-ux; current credit-card-crud and credit-card-available-credit specs; cited frontend source, tests, frontend/shared ITransaction type, Prisma money column definitions, and package scripts
- Language policy: OpenSpec config requires English committed artifacts and Vietnamese conversation. This report is English; no language override.

### Decision summary

Five findings are accepted for bounded follow-up fixes. Two documentation inconsistencies are recorded but need no code or archive edit. Three findings expose conflicting or incomplete product contracts and are not scheduled until the user resolves them. The fractional credit-limit behavior is explicitly accepted by the archived money-input proposal, but it can also cause a metadata-only PATCH to change available credit, which the current card CRUD requirement forbids. The negative reconciliation test expectation and maximum-decimal rounding policy also need contract clarification.

| ID | Original IDs | Claim | Affected feature | Decision | Severity | Why / next action |
| --- | --- | --- | --- | --- | --- | --- |
| RA-001 | frontend/src/components/cards/card-form.tsx#1; openspec/changes/archive/2026-09-28-fix-money-input-ux/specs/credit-card-crud/spec.md#1 | A metadata-only save can round a fractional credit limit and recalculate available credit | Card edit | NEEDS_EVIDENCE | RECOMMEND; elevate to MUST FIX if metadata-only preservation governs | Code path is real, but the archived proposal explicitly accepts fractional normalization while the current main spec says metadata updates leave available credit unchanged. Resolve which behavior applies to an untouched limit. |
| RA-002 | openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md#1 | Design says to truncate digits although tasks/spec require rejecting the over-limit edit | Money input documentation | INFORMATIONAL_NOTE | N/A | Historical design inconsistency; implementation follows the task and scenario. Do not rewrite archived history. |
| RA-003 | openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md#2 | The .50 risk example says rounding to .00 despite half-away-from-zero rounding | Money input documentation | INFORMATIONAL_NOTE | N/A | Arithmetic typo; implementation, test, and spec agree that .50 rounds up. |
| RA-004 | frontend/src/components/cards/transaction-form.test.tsx#1 | Test fixture bypasses required ITransaction fields with an unknown cast | Transaction form test | ACCEPTED_FIX | RECOMMEND | Replace the partial asserted object with a complete typed fixture; this restores useful compile-time checking at low cost. |
| RA-005 | frontend/src/components/cards/reconcile-form.test.tsx#1 | No test covers a negative stored balance hydrated into reconciliation and rejected at submit | Reconciliation test | NEEDS_EVIDENCE | RECOMMEND | The code rejects it, but the archived delta scenario says an untouched form populated with a stored negative value submits that value. Clarify the required behavior before pinning it in a test. |
| RA-006 | frontend/src/components/ui/money-input.tsx#1 | An ignored character turns a hydrated negative amount positive | MoneyInput | ACCEPTED_FIX | MUST FIX | The commit path strips the sign even when sanitization leaves the amount digits unchanged, violating the stored-negative and ignored-character behavior. |
| RA-007 | frontend/src/components/ui/money-input.tsx#2 | Replacing the whole selection with a letter clears the amount instead of ignoring the edit | MoneyInput | ACCEPTED_FIX | MUST FIX | An empty sanitizer result is emitted as the new controlled value, contrary to the explicit non-numeric-input scenario. |
| RA-008 | frontend/src/components/ui/money-input.tsx#3 | Rejecting a multi-digit over-wide paste restores the caret using a one-digit adjustment | MoneyInput caret | ACCEPTED_FIX | RECOMMEND | The value is rolled back but the caret can move right of the edit point. Restore the rejected edit's original caret position and cover multi-digit paste. |
| RA-009 | frontend/src/components/ui/money-input.tsx#4 | Delete before a leading minus skips the sign and deletes an amount digit | MoneyInput deletion | ACCEPTED_FIX | MUST FIX | The code treats every non-digit as a grouping separator; this can silently remove the first digit from a negative stored balance. |
| RA-010 | frontend/src/lib/money-input.utils.ts#1 | Rounding the maximum DECIMAL(15,2) value creates a display that the parser rejects | Money hydration and serialization | NEEDS_EVIDENCE | RECOMMEND | The failure is reproducible, but flooring to the maximum whole value changes the value and conflicts with the chosen half-away display rule. Choose the boundary policy before implementation. |

- Input findings: 11; normalized findings: 10; duplicate mapping: RA-001 merges the card-form and credit-card-crud spec observations because they describe the same fractional limit reserialization path.
- Rejected/deferred findings: None; all remaining non-fix findings are informational or unresolved.
- ACCEPTED_FIX: 5
- REJECTED_FALSE_POSITIVE: 0
- REJECTED_OVER_ENGINEERING: 0
- DEFERRED_OUT_OF_SCOPE: 0
- INFORMATIONAL_NOTE: 2
- NEEDS_EVIDENCE: 3

### OpenSpec scope and traceability

- In scope: the archived change adds shared whole-đồng money inputs, digit grouping and caret handling, separator deletion, sanitization, a 13-integer-digit entry cap, negative stored-value hydration, canonical decimal serialization, and adoption in card, transaction, and reconciliation forms.
- Out of scope: backend validation changes, non-VND currencies, locale-specific separators, and changing the database/API decimal format.
- Binding decisions and contract conflicts: proposal.md says forms normalize stored non-zero cents when saved; design.md rejects hidden discarded-cents state and chooses half-away rounding. The current credit-card-crud main spec says metadata-only updates must not change available credit. The archived delta also says a form populated from a stored negative amount submits that negative value untouched, while ReconcileForm rejects negative submission. At the maximum DECIMAL boundary, half-away rounding produces an integer outside the supported input/parser precision.

| Finding | Capability / spec path | Requirement → scenario | Proposal / design basis | Existing task | Contract effect |
| --- | --- | --- | --- | --- | --- |
| RA-001 | credit-card-crud | Form money inputs format values for display and serialize canonical decimal strings → Populating form with a stored fractional amount; current main requirement User can update card metadata → Update bank and card name / Partial update | Archived proposal.md:20-23, 66-69; design.md:109-113 | 1.3, 3.1 complete | Unresolved conflict: preserve untouched limit and balance, or normalize it on metadata save |
| RA-002 | credit-card-crud | Money inputs sanitize out-of-grammar text and bound stored precision → Integer digits are capped at the storable precision | Archived design.md:74-80 conflicts with tasks.md:1.1 and delta spec:97-100 | 1.1 complete | Documentation correction only; code/spec behavior is already aligned |
| RA-003 | credit-card-crud | Form money inputs format values → Populating form with a stored fractional amount | Archived design.md:75-87, 109-113; proposal.md:66-69; delta spec:23-26; utility test:20-24 | 1.3 complete | Documentation correction only; behavior is already aligned |
| RA-004 | credit-card-available-credit → transaction form | Transaction and reconciliation amount inputs behave like every other money input → Focusing an amount input does not alter its value | Proposal.md:50-52; AGENTS.md strict TypeScript and explicit typing guidance | 3.3, 4.1 complete | No contract change; strengthens the fixture's type safety |
| RA-005 | credit-card-available-credit → reconciliation | Manual reconciliation resets the available credit baseline → Reconcile to a specific value; credit-card-crud delta → Negative stored amount keeps its sign until it is edited | Proposal.md:28-30; reconcile-form.tsx:15-23 | 3.4, 4.1 complete | Unresolved conflict over untouched negative reconciliation submission |
| RA-006 | credit-card-crud → shared money input | Money inputs sanitize out-of-grammar text and bound stored precision → Non-numeric characters are ignored; Form money inputs → Negative stored amount keeps its sign until it is edited | Proposal.md:28-30; design.md:68-87 | 1.3, 2.2, 2.5 complete | Restores existing behavior; no contract change |
| RA-007 | credit-card-crud → shared money input | Money inputs sanitize out-of-grammar text and bound stored precision → Non-numeric characters are ignored | Delta spec:74-76; tasks.md:2.5 | 2.5 complete | Restores existing behavior; no contract change |
| RA-008 | credit-card-crud → shared money input | Money inputs accept keystrokes without discarding input → Typing in the middle of an existing value | Delta spec:35-50; design caret-mapping decision | 2.2, 2.5 complete | Restores cursor position after a rejected edit; no contract change |
| RA-009 | credit-card-crud → shared money input | Money inputs accept keystrokes without discarding input → Forward delete immediately before a group separator | Design.md:60-66 says key interception is for separators; negative stored-value scenario makes the sign reachable | 2.4 complete | Restores separator-specific handling; no contract change |
| RA-010 | credit-card-crud; credit-card-available-credit | Money inputs sanitize out-of-grammar text and bound stored precision → Integer digits are capped at the storable precision; transaction/reconciliation shared-input requirement | Proposal.md:20-27; design.md:85-87; Prisma schema and parser precision guard | 1.3, 1.4, 3.1, 3.3, 3.4 complete | Requires an explicit boundary rule; reviewer floor remedy changes rounding semantics and stored value |

### Accepted findings — recommended for fixing

#### RA-004 — Complete the transaction fixture instead of bypassing ITransaction

- Decision: ACCEPTED_FIX
- Original finding: frontend/src/components/cards/transaction-form.test.tsx#1, line 40. The reviewer notes that the fixture omits required ITransaction fields and is asserted through unknown.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. This does not break the current test, but the assertion disables compile-time checking for the fixture.
- Project finding code: [OS-STD-VIOLATION] — the repository requires strict TypeScript and explicit types; the cast bypasses those checks.
- Affected feature and impact: The TransactionForm edit test exercises hydration and focus/blur behavior. The current form reads the fields that the partial fixture contains, but a future form change could read cardId, idempotencyKey, reconciledAt, or createdAt and receive undefined while TypeScript still treats the value as a complete transaction.
- Origin: Introduced in the current branch's transaction form test.
- Trigger / reproduction: The fixture at frontend/src/components/cards/transaction-form.test.tsx:40-47 omits four fields required by frontend/src/shared/types/index.ts:159-170 and uses as unknown as ITransaction.
- Expected behavior: The test fixture is structurally valid as ITransaction and compilation catches newly required fields.
- Actual behavior: The double assertion suppresses the missing-property error.
- Evidence: frontend/src/components/cards/transaction-form.test.tsx:38-50; frontend/src/shared/types/index.ts:159-170; transaction-form.tsx:88-92 currently reads only the fields supplied by the fixture.
- Counter-evidence considered: No current runtime defect is demonstrated because the form currently accesses only fixture-provided fields. The benefit is keeping the test aligned with the production type contract.
- Why fixing is necessary: A complete fixture prevents this test from silently masking future missing API data.
- Scope basis: The archived change adds the edit-form test as part of transaction money-input migration; this is bounded test-quality work in that touched test.
- Reviewer remedy assessment: Accept. Construct a full typed fixture; no helper abstraction is needed.
- Minimal remediation: Add cardId, idempotencyKey, reconciledAt, and createdAt with representative values and declare the object as ITransaction. Remove the double assertion.
- Compatibility and non-goals: Preserve the existing focus/blur assertions and test data semantics. Do not alter TransactionForm or expand transaction behavior.
- Dependencies / order: None.
- OpenSpec integration: No contract change. The archived task 3.3 is complete and remains historical; map this follow-up test task in a new active change.
- Acceptance criteria:
  - WHEN the fixture is declared as ITransaction, THEN it compiles without a type assertion and includes all required fields.
  - WHEN the focused transaction form test runs, THEN the existing display and focus/blur assertions pass.
- Regression verification: Run pnpm --filter frontend test -- src/components/cards/transaction-form.test.tsx and pnpm typecheck:frontend. Both commands are present in package scripts; neither was run during adjudication.
- Plan task IDs: 2.1 below

#### RA-006 — Preserve a stored negative sign when an ignored edit changes no amount digits

- Decision: ACCEPTED_FIX
- Original finding: frontend/src/components/ui/money-input.tsx#1, line 66. The reviewer says an edit that sanitizes away without changing amount digits must keep the stored negative sign.
- Reviewer severity / adjudicated severity: P1 / MUST FIX. An ignored character can silently turn an overspent balance positive.
- Project finding code: [OS-SPEC-MISMATCH]
- Affected feature and impact: MoneyInput is shared by card, transaction, and reconciliation forms. A negative stored available-credit value is a supported state. Typing an ignored letter, period, space, or currency symbol can change the value sent to reconciliation from negative to positive.
- Origin: Introduced by the new MoneyInput commit path in this branch.
- Trigger / reproduction: Hydrate value -2,500, type a non-money character without changing digits, and commit receives a sanitized -2500. money-input.tsx:66 removes the sign unconditionally, producing 2,500; because it differs from the current value, onValueChange runs at lines 74-86.
- Expected behavior: An ignored edit that preserves the amount digits also preserves the hydrated sign; a real digit edit drops the sign as specified.
- Actual behavior: Sign removal is unconditional, so the ignored edit changes the form value.
- Evidence: frontend/src/components/ui/money-input.tsx:65-86; frontend/src/lib/money-input.utils.ts:165-181 preserves the leading sign; money-input.test.tsx:91-117 covers ignored edits only on a positive value and sign removal only after a real edit.
- Counter-evidence considered: The existing test correctly expects a real digit edit to drop the sign, and typed minus signs are rejected. Neither justifies removing the sign when sanitization changes no digits.
- Why fixing is necessary: This silently changes a negative balance in a critical money flow and can allow a reconciliation submit with a positive value after an unrelated keystroke.
- Scope basis: Restores the archived ignored-character and negative-hydration behavior.
- Reviewer remedy assessment: Accept the digit comparison, while preserving explicit sign deletion and the existing real-edit behavior.
- Minimal remediation: Compare the unsigned sanitized candidate with current amount digits before removing a hydrated sign. Preserve the sign when the candidate digits are unchanged and the raw edit did not explicitly remove the sign; otherwise keep the specified non-negative edit behavior.
- Compatibility and non-goals: Keep typed-minus rejection, negative real-edit behavior, grouping, storage cap, and canonical serialization. Do not add hidden fractional state or change backend validation.
- Dependencies / order: Coordinate with RA-009 so explicit Delete of the sign remains effective.
- OpenSpec integration: Archived tasks 1.3 and 2.5 are complete. Record this as a new active follow-up task; no spec change is needed if the existing negative-hydration contract is retained.
- Acceptance criteria:
  - WHEN a negative stored value receives a rejected letter, period, space, or currency-symbol edit, THEN both the value and sign remain unchanged.
  - WHEN a user changes an amount digit, THEN the sign is removed as before.
  - WHEN a user explicitly removes the leading minus, THEN the amount digits remain intact.
- Regression verification: Extend frontend/src/components/ui/money-input.test.tsx with ignored-edit cases on a negative initial value and retain the existing real-edit case. Run pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- Plan task IDs: 1.1 below

#### RA-007 — Ignore invalid replacement text without clearing a selected amount

- Decision: ACCEPTED_FIX
- Original finding: frontend/src/components/ui/money-input.tsx#2, line 68. The reviewer reports that typing a letter over a full selection clears the existing amount.
- Reviewer severity / adjudicated severity: P3 / MUST FIX because the behavior contradicts the explicit sanitization scenario.
- Project finding code: [OS-SPEC-MISMATCH]
- Affected feature and impact: Any shared money field can lose its displayed amount when the user selects all and types a letter or another character with no digits.
- Origin: Introduced by the new MoneyInput change handler in this branch.
- Trigger / reproduction: With value 400,000, select all and type x. sanitizeMoneyInputDigits('x') returns an empty string; groupMoneyDigits returns an empty string; commit sees a changed value and calls onValueChange('').
- Expected behavior: The invalid replacement is rejected and the existing amount remains in the field. An explicit clear/delete still leaves the field empty.
- Actual behavior: The input becomes empty.
- Evidence: frontend/src/components/ui/money-input.tsx:65-86; frontend/src/lib/money-input.utils.ts:165-178; money-input.test.tsx:91-99 asserts ignored characters only when they do not replace a selection, while lines 137-143 cover explicit clearing.
- Counter-evidence considered: Explicitly clearing the entire value must remain supported. The fix should distinguish a digitless rejected insertion from an actual empty input, not reject every empty sanitized result.
- Why fixing is necessary: A character the component promises to ignore can instead remove all user-entered data and make a required form invalid.
- Scope basis: Directly restores the archived Non-numeric characters are ignored scenario.
- Reviewer remedy assessment: Accept the rollback outcome; keep explicit clear behavior and restore the selection caret sensibly.
- Minimal remediation: In MoneyInput, reject a non-empty edit candidate that sanitizes to no amount digits when the current value is non-empty; roll the DOM value back to the controlled value. Preserve the empty raw candidate generated by explicit deletion.
- Compatibility and non-goals: Preserve regular sanitization when digits remain, over-wide rejection, explicit clear, and the current submit schemas.
- Dependencies / order: None.
- OpenSpec integration: Archived task 2.5 is complete; add a follow-up task without changing the archived ledger or existing requirement.
- Acceptance criteria:
  - WHEN the whole value is selected and replaced with a letter, THEN the original value remains visible and no empty value is emitted.
  - WHEN the whole value is explicitly deleted, THEN the input remains empty as the existing clear scenario requires.
- Regression verification: Add userEvent selection-replacement and explicit-clear assertions to frontend/src/components/ui/money-input.test.tsx. Run pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- Plan task IDs: 1.2 below

#### RA-008 — Restore the edit-point caret after rejecting an over-wide paste

- Decision: ACCEPTED_FIX
- Original finding: frontend/src/components/ui/money-input.tsx#3, line 70. The reviewer says the rejected-edit caret calculation assumes one inserted digit even for a multi-digit paste.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. The value is correctly rejected, but a paste can leave the caret at a misleading position.
- Project finding code: [OS-EDGE-CASE]
- Affected feature and impact: Users correcting a maximum-width amount can paste additional digits mid-field; the component restores the value but shifts the caret right of the edit point.
- Origin: Introduced by the new over-width rejection caret calculation in this branch.
- Trigger / reproduction: Start with 1,234,567,890,123, place the caret after the first digit, and paste 99. The candidate exceeds the cap and is rolled back, but digitsBeforeCaret includes pasted digits while the code subtracts a constant one.
- Expected behavior: The amount stays unchanged and the caret returns to the edit point that preceded the rejected paste.
- Actual behavior: The formula Math.max(0, digitsBeforeCaret - 1) is independent of how many digits were inserted, so a multi-digit paste moves the caret.
- Evidence: frontend/src/components/ui/money-input.tsx:65-81; caretOffsetForDigitIndex in frontend/src/lib/money-input.utils.ts:194-211; money-input.test.tsx:145-159 checks rejected single-digit edits and value preservation but not caret location.
- Counter-evidence considered: Single-digit rejected edits match the current subtraction. That does not establish correct behavior for paste or other multi-digit edits.
- Why fixing is necessary: Cursor preservation is a binding requirement; repeated jumps make an already-maximal amount difficult to edit.
- Scope basis: Supporting edge case for the archived live-formatting and caret-preservation requirement.
- Reviewer remedy assessment: Accept the outcome. Derive the rollback caret from the actual pre-edit selection or equivalent edit delta; do not assume every rejected edit inserted one character.
- Minimal remediation: In MoneyInput, retain enough pre-edit selection information to restore the caret after a rejected over-wide mutation; add a multi-digit paste test at a middle caret position.
- Compatibility and non-goals: Keep the current 13-digit rejection policy and existing one-digit behavior. Do not truncate the input because the archived task explains that truncation can rewrite digits edited in the middle.
- Dependencies / order: None.
- OpenSpec integration: Archived tasks 2.2 and 2.5 are complete; record a new follow-up task without changing the archived ledger.
- Acceptance criteria:
  - WHEN an over-wide multi-digit paste is made at a middle caret position, THEN the displayed value remains unchanged and the caret returns to the pre-edit point.
  - WHEN one over-wide digit is typed, THEN the current value rejection behavior remains intact.
- Regression verification: Extend frontend/src/components/ui/money-input.test.tsx with an over-wide paste case that asserts both value and selectionStart. Run pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- Plan task IDs: 1.3 below

#### RA-009 — Do not redirect Delete across the leading minus sign

- Decision: ACCEPTED_FIX
- Original finding: frontend/src/components/ui/money-input.tsx#4, line 118. The reviewer says Delete before a leading minus removes the following amount digit.
- Reviewer severity / adjudicated severity: P2 / MUST FIX. This is silent data loss in a supported negative stored state.
- Project finding code: [OS-ARCH-VIOLATION]
- Affected feature and impact: A stored negative available-credit balance can be edited through a shared money field. Pressing Delete at offset zero can remove the first amount digit while also normalizing the sign.
- Origin: Introduced by the new MoneyInput key handler in this branch.
- Trigger / reproduction: With -2,500 and a collapsed caret at offset zero, the Delete branch treats '-' as a separator, scans to '2', removes it, and commit returns 500.
- Expected behavior: Delete before the leading sign removes only the sign and preserves all amount digits; Delete before a grouping comma continues to remove the following digit.
- Actual behavior: The generic non-digit scan skips '-' and removes the next digit.
- Evidence: frontend/src/components/ui/money-input.tsx:118-125; design.md:60-66 limits key interception to separators; money-input.test.tsx:74-81 covers comma deletion only.
- Counter-evidence considered: Existing comma deletion is correct and must remain. It does not support classifying a minus sign as a grouping separator.
- Why fixing is necessary: An editing keystroke can silently change the magnitude of a stored balance.
- Scope basis: Restores the design's separator-only key interception and preserves the documented negative hydration behavior.
- Reviewer remedy assessment: Accept. Restrict redirection to grouping commas or handle the leading minus separately.
- Minimal remediation: Narrow the Delete redirect guard so it only scans across a comma; allow native Delete before '-' to remove the sign while keeping the digits.
- Compatibility and non-goals: Preserve Delete-before-comma, Backspace behavior, typed-minus rejection, and real digit editing. Do not change negative submission validation.
- Dependencies / order: Coordinate with RA-006 for explicit sign removal behavior.
- OpenSpec integration: Archived task 2.4 is complete; create a new active follow-up task and leave historical tasks untouched.
- Acceptance criteria:
  - WHEN value -2,500 has the caret before '-', and Delete is pressed, THEN value becomes 2,500 with all amount digits preserved.
  - WHEN value 400,000 has the caret before ',', and Delete is pressed, THEN it remains 40,000 with the existing caret behavior.
- Regression verification: Add the leading-minus case to frontend/src/components/ui/money-input.test.tsx and run pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- Plan task IDs: 1.4 below

### Findings not scheduled for fixing

#### RA-002 — Archived design describes truncation that the implementation rejects

- Decision: INFORMATIONAL_NOTE
- Original finding: openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md#1, line 79, reviewer severity P2.
- Adjudicated severity / project code: N/A — documentation inconsistency only; no current code/spec defect.
- Affected feature and actual behavior: The design's sanitization list says to truncate to 13 digits. The implementation returns over-wide digits uncapped, and MoneyInput rejects the over-wide candidate by restoring the previous value.
- Evidence and contract basis: openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md:74-80 conflicts with tasks.md:1.1 and the delta scenario Integer digits are capped at the storable precision at specs/credit-card-crud/spec.md:97-100. money-input.utils.test.ts:114-116 confirms uncapped sanitization; money-input.test.tsx:145-159 confirms component rejection.
- Independent reasoning: The reviewer is correct that the archived design sentence conflicts with the implementation. The task records why truncation was rejected: it can rewrite other digits during a middle edit. The spec and tests state the shipped behavior clearly.
- Consequence of leaving unchanged: A future reader could follow the inaccurate historical design step, but the archived task and current spec provide the correct behavior. No source fix is needed for the supplied issues.
- Disposition: Keep this finding as a historical documentation note; do not rewrite archived artifacts.
- Reconsider only if: A future active change relies on the design document as implementation guidance; then resolve it in active artifacts without rewriting archive history.

#### RA-003 — Archived risk example contradicts half-away rounding

- Decision: INFORMATIONAL_NOTE
- Original finding: openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md#2, line 109, reviewer severity P3.
- Adjudicated severity / project code: N/A — arithmetic typo in a historical example.
- Affected feature and actual behavior: The risk text says 50,000,000.50 normalizes to 50,000,000.00. The preceding rule rounds halves away from zero, so that value formats as 50,000,001; the utility test and delta scenario assert the increment.
- Evidence and contract basis: openspec/changes/archive/2026-09-28-fix-money-input-ux/design.md:75-87, 109-113; openspec/changes/archive/2026-09-28-fix-money-input-ux/proposal.md:66-69 repeats the same wrong example; archived credit-card-crud spec:23-26; frontend/src/lib/money-input.utils.test.ts:20-24.
- Independent reasoning: The example is wrong. Both the implementation and its test follow the selected rounding rule, so changing code to fit the example would be incorrect.
- Consequence of leaving unchanged: The contradictory example may confuse future readers, but current behavior is unambiguous in the rule, task, spec, and test.
- Disposition: Record the correction here; do not edit archived history during adjudication.
- Reconsider only if: A maintained non-archived money-input guide is introduced and needs a coherent rounding example.

### Unresolved findings and decisions

| ID | Claim / affected feature | Evidence checked | Missing evidence or conflict | Specific next check / user decision | Implementation impact |
| --- | --- | --- | --- | --- | --- |
| RA-001 | Fractional stored credit limit is rounded and may alter available credit during metadata-only card edit | CardForm.defaultValues at frontend/src/components/cards/card-form.tsx:318 formats the stored limit; CardForm.handleFormSubmit at :332-336 serializes it; EditCardSheet.handleSubmit at frontend/src/components/cards/edit-card-sheet.tsx:42-45 includes a changed canonical value in the PATCH; current CRUD spec says metadata updates leave available credit unchanged | Archived proposal.md:66-69 explicitly accepts normalizing stored cents on save; current main spec at openspec/specs/credit-card-crud/spec.md:62-75 says metadata-only updates must preserve available credit | Decide whether an untouched fractional creditLimit is normalized on metadata save or omitted from the PATCH. If omitted, preserve the metadata-only balance contract; if normalized, update the contract and explicitly accept the balance delta. | No checkbox until contract is resolved; then either a narrow EditCardSheet guard/test or a spec/design update plus behavior test |
| RA-005 | Negative stored available credit hydrates into ReconcileForm but is rejected on submit; test coverage is absent | ReconcileForm defaults at frontend/src/components/cards/reconcile-form.tsx:50-55 format the stored value; buildReconcileSchema at :15-23 rejects canonical values beginning with '-'; current test only sanitizes manually typed negatives to positive. The origin/main test asserted manually entered -0 rejection, a path the new proposal now normalizes to 0. | Archived delta scenario at openspec/changes/archive/2026-09-28-fix-money-input-ux/specs/credit-card-crud/spec.md:28-31 says an untouched form populated with -2,500,000 sends the negative canonical amount; proposal.md:28-30 says money forms reject negative values | Clarify whether reconciliation of an untouched overspent balance should fail validation or preserve/send the existing negative value. If failure is intended, add the reviewer's hydration/error/no-submit test and reconcile the archived requirement in a new active change. | No test task until expected behavior is settled; an API/schema behavior change may be needed if unchanged negative values must submit |
| RA-010 | Maximum valid DECIMAL formats above the 13-digit input/parser cap and cannot be submitted untouched | Prisma columns at backend/prisma/schema.prisma:80, 93, 107, 129 use DECIMAL(15,2); parser test at frontend/src/lib/money-input.utils.test.ts:198-200 accepts 9,999,999,999,999.99; formatMoneyForInput at frontend/src/lib/money-input.utils.ts:143-153 rounds it to 10,000,000,000,000; parser rejects that value at :99-102 and :219-234 | Reviewer suggests flooring to the largest whole value, but design.md:85-87 requires half-away rounding matching dashboard display; floor also changes stored .99 to .00 on submit and diverges from the other display | Choose the upper-bound rule: preserve/display a special exact value, cap at the largest whole storable amount and accept normalization, or another explicit policy. Update the active spec/design before implementation. | No checkbox until a boundary policy is chosen; formatter, parser/form validation, and all relevant edit-form tests may be affected |

### Verification evidence and future checks

| Check | Phase | Command / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- | --- |
| Repository and diff scope | Adjudication | git status --short; git rev-parse HEAD; git merge-base HEAD origin/main; git diff --stat origin/main...HEAD | PASS | HEAD 51e8665; base 50556e6; 22 committed files differ; two pre-existing untracked paths preserved |
| CodeGraph structural inspection | Adjudication | codegraph status .; codegraph explore on CardForm/EditCardSheet, MoneyInput, formatting/parser, and ReconcileForm | PASS | Index reports up-to-date and supplied caller paths/source; it notes the index was built by an earlier engine version |
| OpenSpec root and lifecycle | Adjudication | openspec context --json; openspec list --json; read local archived artifacts | PASS | Local root resolved; no active changes; matching change is archived and all relevant tasks are checked |
| Current spec validation | Adjudication | openspec validate --specs --strict | PASS | 6 specs passed; two informational long-requirement notices; validates artifact structure, not behavior or this report |
| Archived task validation | Adjudication | openspec validate --archived --strict | PASS | 11 archived changes passed; checks archived task completion, not runtime behavior |
| Focused frontend tests / typecheck | Adjudication | Not run | NOT RUN | Source traces and assertions were inspected; no test command was needed to establish these deterministic paths |
| RA-004 fixture check | Future implementation | pnpm typecheck:frontend and pnpm --filter frontend test -- src/components/cards/transaction-form.test.tsx | NOT RUN | Fixture must compile as ITransaction and the existing test must pass |
| RA-006/007/008/009 regressions | Future implementation | pnpm --filter frontend test -- src/components/ui/money-input.test.tsx | NOT RUN | Verify negative ignored edits, invalid selection replacement, multi-digit paste caret, and Delete before minus |
| OpenSpec current/archived validation | Adjudication | openspec validate --specs --strict; openspec validate --archived --strict | PASS | Structural validation only; no artifact edits were made |

### Handoff instructions for the implementing agent

1. Read this report, current code, AGENTS.md, OpenSpec config, current specs, and the archived change artifacts. Revalidate findings if HEAD or the working-tree state changes.
2. Implement only user-selected ACCEPTED_FIX findings. “Fix the issues in this report” selects RA-004, RA-006, RA-007, RA-008, and RA-009; unresolved RA-001, RA-005, and RA-010 require the decisions stated above first. Informational notes RA-002 and RA-003 do not authorize archive edits.
3. There is no matching active change. For selected accepted work, use openspec-propose to establish a new active follow-up and record the accepted finding IDs in its tasks. If the user resolves RA-001, RA-005, or RA-010 with a contract change, reconcile the needed design/spec through openspec-update-change or create a separate proposal when the follow-up scope warrants it. Never rewrite archived history.
4. Transfer approved report tasks to the new authoritative tasks artifact with report-ID mappings. This report does not replace proposal/specs/design/tasks and is not automatically consumed by apply.
5. After planning and user decisions are satisfied, follow openspec-apply-change. Keep code changes limited to approved findings, run the listed checks, and mark authoritative tasks complete only when acceptance criteria pass.
6. Report any remaining failures; do not expand work to rejected, informational, unresolved, or unselected findings.

### Decisions requested from the user

- Select the accepted fixes to implement: RA-004, RA-006, RA-007, RA-008, and RA-009. “Fix the issues in this report” will select these accepted items only.
- Resolve three contract questions before scheduling work: RA-001 (normalize fractional limits on metadata-only save or preserve them), RA-005 (reject or preserve untouched negative reconciliation values), and RA-010 (define maximum DECIMAL display/rounding).
- No source, tests, migrations, configuration, or existing OpenSpec artifacts were changed during adjudication.

## Proposed implementation checklist

Only ACCEPTED_FIX findings are eligible. All entries remain unchecked until authorized work is implemented and verified through the authoritative OpenSpec task ledger. Unresolved and informational findings have no implementation checkboxes.

## 1. MoneyInput interaction regressions

- [ ] 1.1 [RA-006] Preserve a stored negative sign for a sanitized no-op edit in frontend/src/components/ui/money-input.tsx; add negative-initial-value ignored-character and real-digit-edit assertions in money-input.test.tsx; verify with pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- [ ] 1.2 [RA-007] Roll back a non-empty digitless selection replacement while preserving explicit clear in frontend/src/components/ui/money-input.tsx; add both userEvent cases in money-input.test.tsx; verify with pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- [ ] 1.3 [RA-008] Restore the pre-edit caret after a rejected multi-digit over-wide paste in frontend/src/components/ui/money-input.tsx; assert unchanged value and caret in money-input.test.tsx; verify with pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.
- [ ] 1.4 [RA-009] Restrict Delete redirection to a grouping comma in frontend/src/components/ui/money-input.tsx; test Delete before a leading minus and retain Delete-before-comma behavior in money-input.test.tsx; verify with pnpm --filter frontend test -- src/components/ui/money-input.test.tsx.

## 2. Transaction form fixture safety

- [ ] 2.1 [RA-004] Replace the partial unknown-cast fixture in frontend/src/components/cards/transaction-form.test.tsx with a complete ITransaction object; verify with pnpm typecheck:frontend and pnpm --filter frontend test -- src/components/cards/transaction-form.test.tsx.
