# Review Adjudication and Remediation Plan

- Report status: PROPOSED — no fixes applied
- User implementation decision: PENDING — no accepted finding has been authorized for implementation
- Adjudication coverage: COMPLETE — limited to the three supplied money-input findings
- Review source: User-supplied inline comments at `frontend/src/components/ui/money-input.tsx` and `frontend/src/lib/money-input.utils.ts`; no original review IDs or severities were supplied, so `SRC-001` through `SRC-003` are local traceability IDs
- Repository / branch: `/Users/Shared/workspace/credit_reminder` / `fix/price-input-issue`
- Reviewed revision / current HEAD: `51e8665270a60c30d550fd1c42712f06b7704915`
- Diff base and working-tree scope: `origin/main` (`50556e6bc8d910a6040337e972f5b62aeecf76f2`) to `HEAD`, 22 files changed (`+1369/-133`); current working tree has no target-file changes and one unrelated untracked path, `ytuong.md`
- OpenSpec root / store: `/Users/Shared/workspace/credit_reminder/openspec` / local store, no external store
- Change / lifecycle / schema: `2026-09-28-fix-money-input-ux` / archived / `spec-driven`; no active changes are listed
- Artifacts and standards read: `AGENTS.md`, `openspec/config.yaml`, archived `proposal.md`, `design.md`, delta specs, and `tasks.md` for the matching change, current `openspec/specs/credit-card-crud/spec.md`, current `openspec/specs/credit-card-available-credit/spec.md`, root and frontend `package.json` scripts, and the cited source/tests
- Language policy: OpenSpec configuration requires committed artifacts in English; this report is English. Conversational delivery remains Vietnamese.

### Decision summary

All three findings are technically valid defects introduced by `HEAD` in the reviewed money-input change. The first two are direct violations of the archived money-input behavior and can be fixed with small component changes plus regression tests. The third is a valid parser/display boundary defect: a valid maximum `DECIMAL(15,2)` value can round to a 14-digit display that the parser rejects. Preserving that stored value at the boundary requires an explicit follow-up decision because the archived design otherwise requires whole-đồng display.

| ID | Original IDs | Claim | Affected feature | Decision | Severity | Why / next action |
| --- | --- | --- | --- | --- | --- | --- |
| RA-001 | SRC-001 | Delete before a leading minus is redirected past the sign and deletes the next digit | `MoneyInput` deletion and caret behavior | ACCEPTED_FIX | MUST FIX | The generic non-digit scan at `money-input.tsx:118-125` treats `-` as a separator. Restrict redirection to grouping commas and add a leading-minus regression test. |
| RA-002 | SRC-002 | Ignored edits strip the sign from an unchanged negative stored amount | Negative stored money hydration/editing | ACCEPTED_FIX | MUST FIX | `money-input.tsx:66` always removes the sanitized sign before comparing or committing. Preserve a negative value when the amount digits did not change, while still accepting explicit sign removal and real amount edits. |
| RA-003 | SRC-003 | Rounding a valid maximum amount can create a display that `parseMoneyInputToCanonicalDecimal()` rejects | Money hydration and canonical serialization | ACCEPTED_FIX | MUST FIX | `roundCentsToWholeDong()` can overflow the 13-digit parser limit. Add a boundary-safe preservation path and a round-trip regression test; reconcile the display exception in a new active OpenSpec change before implementation. |

- Input findings: 3; normalized findings: 3; duplicate/split mapping: none; local source IDs were assigned because the supplied comments had no IDs
- ACCEPTED_FIX: 3
- REJECTED_FALSE_POSITIVE: 0
- REJECTED_OVER_ENGINEERING: 0
- DEFERRED_OUT_OF_SCOPE: 0
- INFORMATIONAL_NOTE: 0
- NEEDS_EVIDENCE: 0

### OpenSpec scope and traceability

- In scope: the archived change's shared `MoneyInput`, live grouping and caret preservation, separator-aware deletion, sanitization of out-of-grammar input, negative stored-value behavior, 13-integer-digit persistence bounds, `formatMoneyForInput()` hydration, and canonical decimal serialization across card, transaction, and reconciliation forms.
- Out of scope: backend validation, Prisma/API schema changes, currencies other than VND, locale-aware separators, masked-input libraries, and changing the canonical parse/serialize direction.
- Binding decisions and contract conflicts: `design.md` requires digit-space caret mapping, `onKeyDown` interception only for separators, string-safe money handling, and no hidden discarded-cents state. The user-supplied RA-003 remedy—preserving a valid stored value when whole-đồng rounding would overflow—creates a narrow boundary exception to the archived whole-đồng display rule and must be recorded by a new active change rather than by rewriting archived artifacts.

| Finding | Capability / spec path | Requirement → scenario | Proposal / design basis | Existing task | Contract effect |
| --- | --- | --- | --- | --- | --- |
| RA-001 | `credit-card-crud` → shared money-input keystroke behavior | `Money inputs accept keystrokes without discarding input` → `Forward delete immediately before a group separator`; supporting design rule `Separator-deleting keys are intercepted in onKeyDown` | Archived `design.md` lines 60-66; the implementation must recognize grouping commas, not every non-digit character | `2.4` (completed; its test covers comma deletion only) | Restores the existing contract; no requirement change |
| RA-002 | `credit-card-crud` → money sanitization and negative hydration | `Money inputs sanitize out-of-grammar text and bound stored precision` → `Non-numeric characters are ignored`; modified money-display requirement → `Negative stored amount keeps its sign until it is edited` | Archived `proposal.md` “refuse a typed minus sign” and “negative amount already stored ... hydrates with its sign until the field is edited”; archived `design.md` sanitization decision | `2.5` and `1.3` (completed; neither asserts an ignored edit on a negative value) | Restores the existing contract; no requirement change |
| RA-003 | `credit-card-crud` → money hydration and canonical serialization | `Form money inputs format values for display and serialize canonical decimal strings` → `Populating form with existing decimal values` / stored fractional amount; current parser precision boundary | Archived `proposal.md` 13-digit cap and canonical serialization; archived `design.md` string-precision constraint; current parser guard at `money-input.utils.ts:99-102, 226-234` | `1.3` and `1.4` (completed; no max-value round-trip case) | Parser-safe boundary preservation is required; retaining fractional text at this exceptional overflow boundary requires an explicit follow-up artifact decision |

### Accepted findings — recommended for fixing

#### RA-001 — Delete handling incorrectly skips a leading minus

- Decision: ACCEPTED_FIX
- Original finding: `SRC-001`, inline comment at `frontend/src/components/ui/money-input.tsx` around lines 118-125. The reviewer claims that Delete redirection should skip only grouping commas, not a leading minus, so Delete before `-` removes the sign rather than the next digit.
- Reviewer severity / adjudicated severity: Reviewer severity not provided / MUST FIX. This is a user-visible money-entry corruption on a supported hydrated state and contradicts the component's own separator-only design.
- Project finding code: `[OS-SPEC-MISMATCH]`
- Affected feature and impact: The shared `MoneyInput` is used by card limits, available credit, transaction amounts, and reconciliation amounts. A user editing an overspent negative available-credit value can lose the first amount digit when attempting to remove only the sign.
- Origin: Introduced by `HEAD` in the new `MoneyInput` implementation; the target component does not exist in the diff base.
- Trigger / reproduction: With `value = '-2,500'` and a collapsed caret at offset `0`, `handleKeyDown()` enters the Delete branch because `element.value[0]` is not a digit. The loop advances over `-` to the `2`, constructs `-,500`, and `commit()` sanitizes it to positive `500`. The leading digit is deleted instead of only the sign.
- Expected behavior: Delete at offset `0` before `-` removes only the sign, leaving `2,500`; Delete at offset `3` before the comma in `400,000` continues to remove the following digit and produce `40,000`.
- Actual behavior: `handleKeyDown()` treats any non-digit as a separator at `money-input.tsx:118-125`, so the leading minus is skipped and the next digit is removed. `commit()` then strips the sign at `money-input.tsx:66`.
- Evidence: `frontend/src/components/ui/money-input.tsx:103-126` (`handleKeyDown`), especially the generic `!isDigit()` guard and forward scan; `frontend/src/components/ui/money-input.test.tsx:74-81` covers only comma deletion; archived `credit-card-crud` delta spec scenario “Forward delete immediately before a group separator” establishes the intended comma-specific behavior.
- Counter-evidence considered: The existing comma-delete test passes and proves the intended digit-redirection behavior for a grouping comma. It does not justify scanning over `-`; the archived design explicitly describes separator interception, and the negative hydration scenario makes a leading sign reachable.
- Why fixing is necessary: Leaving this unchanged can silently change a stored negative amount by deleting its most significant digit during a normal sign-removal edit. The issue affects all consumers through the shared primitive.
- Scope basis: This is a supporting correction inside the archived money-input change and does not expand the feature beyond its specified deletion and negative-value behavior.
- Reviewer remedy assessment: Accept the reviewer’s core remedy. The smallest implementation is to redirect Delete only when the adjacent character is a grouping comma, allowing native/change handling to remove a leading minus; do not generalize the scan or add a new abstraction.
- Minimal remediation: Narrow the Delete interception in `frontend/src/components/ui/money-input.tsx` to grouping commas, or explicitly handle a leading-minus deletion before the comma-redirection path. Preserve the existing comma and digit deletion behavior. Add a component regression test for `-2,500` with the caret before the sign.
- Compatibility and non-goals: Preserve Backspace behavior, Delete-before-comma behavior, caret remapping, typed-minus rejection, API payloads, and all non-money inputs. Do not change parser rules or allow negative submitted amounts.
- Dependencies / order: RA-002 shares the sign-removal path; implement and test RA-001 and RA-002 together or apply RA-001 first so explicit sign removal is distinguishable from an ignored edit.
- OpenSpec integration: The archived task `2.4` is complete and must not be rewritten. For implementation, establish a new active follow-up change with `openspec-propose` because the matching change is archived, then map this report ID to a new unchecked task; no requirement delta is needed if the fix restores comma-only interception.
- Acceptance criteria:
  - WHEN the value is `-2,500`, the caret is immediately before `-`, and the user presses Delete, THEN the value becomes `2,500` and the `2` is preserved.
  - WHEN the value is `400,000`, the caret is immediately before the comma, and the user presses Delete, THEN the value remains `40,000` with the existing kept-digit/caret behavior.
- Regression verification: Add focused `userEvent` cases to `frontend/src/components/ui/money-input.test.tsx` and run `pnpm --filter frontend test -- --runInBand src/components/ui/money-input.test.tsx`.
- Plan task IDs: `1.1`, `1.3` below

#### RA-002 — Ignored edits incorrectly remove the sign from negative stored values

- Decision: ACCEPTED_FIX
- Original finding: `SRC-002`, inline comment at `frontend/src/components/ui/money-input.tsx` line 66. The reviewer claims the component must detect whether amount digits changed before stripping a minus sign, preserving a negative value for ignored keystrokes.
- Reviewer severity / adjudicated severity: Reviewer severity not provided / MUST FIX. The failure violates both the ignored-character scenario and the explicit negative-hydration contract.
- Project finding code: `[OS-SPEC-MISMATCH]`
- Affected feature and impact: A negative `availableCredit` can legitimately hydrate to show an overspent balance. Typing a letter, period, space, or `đ`—characters the money input promises to ignore—currently changes that stored negative value to a positive value in form state.
- Origin: Introduced by `HEAD` in `MoneyInput.commit()`.
- Trigger / reproduction: With `value = '-2,500'`, an ignored character appended to the DOM produces a raw candidate such as `-2,500a`. `sanitizeMoneyInputDigits()` returns `-2500`, but `commit()` immediately applies `.replace(/^-/, '')` at `money-input.tsx:66`, so the next value is `2,500` even though no amount digit changed.
- Expected behavior: If sanitization leaves the amount digits unchanged and the candidate still carries the stored leading minus, the displayed value and form state remain `-2,500`. If a digit is actually edited, the sign is removed as specified; if the user explicitly deletes the sign, the sign is removed without deleting a digit.
- Actual behavior: `commit()` strips the sign unconditionally before deciding whether the edit is over-wide or whether the value changed. Existing tests cover positive ignored characters and a negative value edited with a digit, but not a negative value receiving an ignored edit.
- Evidence: `frontend/src/components/ui/money-input.tsx:65-86` (`commit`), `frontend/src/lib/money-input.utils.ts:165-182` (`sanitizeMoneyInputDigits` preserves a leading sign), `frontend/src/components/ui/money-input.test.tsx:91-99` (positive ignored-character test), and `:109-117` (real edit of a negative value). The archived scenarios require ignored characters to leave the value unchanged and negative stored amounts to keep their sign until edited.
- Counter-evidence considered: The existing negative test correctly expects the sign to disappear after typing a digit, so the product does require sign removal for a real amount edit. That does not support unconditional sign removal for a no-op sanitization result.
- Why fixing is necessary: This is silent value mutation in a critical money form. It can cause an untouched or otherwise invalid edit to submit a different sign than the stored amount.
- Scope basis: The fix is within the archived shared component's sanitization contract and preserves the existing canonical serialization direction.
- Reviewer remedy assessment: Accept the reviewer’s digit-change comparison, with one necessary clarification: explicit sign deletion must remain effective even when amount digits are unchanged, so the candidate sign state must be considered alongside the digit comparison.
- Minimal remediation: Compare the sanitized unsigned amount digits with the current value's amount digits before stripping the sign. Preserve the negative candidate for ignored edits that leave those digits unchanged; remove the sign for an actual amount-digit edit or an explicit sign deletion. Avoid introducing hidden cents or form-level state.
- Compatibility and non-goals: Preserve typed-minus rejection, ordinary positive sanitization, 13-digit rejection, comma grouping, and the existing behavior that a real edit to a negative stored amount becomes non-negative. Do not alter backend validation or canonical parser semantics.
- Dependencies / order: Coordinate with RA-001 so Delete-before-minus is treated as an explicit sign deletion rather than as an ignored no-op. No dependency on RA-003.
- OpenSpec integration: The archived tasks `1.3` and `2.5` are complete and must remain historical. Create a new active follow-up task mapped to RA-002; no spec change is needed because this restores the archived scenarios.
- Acceptance criteria:
  - WHEN the value is `-2,500` and the user types an ignored character such as `a`, `.`, whitespace, or `đ`, THEN the value remains `-2,500`.
  - WHEN the user changes an amount digit, THEN the sign is removed and the changed non-negative amount is grouped as before.
  - WHEN the user explicitly deletes the leading minus, THEN the value becomes positive without losing any amount digit.
- Regression verification: Extend `frontend/src/components/ui/money-input.test.tsx` with ignored-edit cases on a negative initial value and retain the existing real-edit assertion; run the focused component test command from RA-001.
- Plan task IDs: `1.2`, `1.3` below

#### RA-003 — Rounding can create an unparseable overflow display

- Decision: ACCEPTED_FIX
- Original finding: `SRC-003`, inline comment at `frontend/src/lib/money-input.utils.ts` around lines 152-153. The reviewer claims `formatMoneyForInput()` must not round a valid stored value beyond the parser's 13-integer-digit limit and must preserve the original stored amount instead of clamping or silently changing it.
- Reviewer severity / adjudicated severity: Reviewer severity not provided / MUST FIX. This is a valid maximum-precision money value entering a form path that cannot serialize its displayed result.
- Project finding code: `[OS-SPEC-MISMATCH]`
- Affected feature and impact: Card edit, transaction edit, and reconciliation hydration all call `formatMoneyForInput()`, then submit through `parseMoneyInputToCanonicalDecimal()`. A valid stored value at `9,999,999,999,999.99` rounds to a 14-digit whole amount that the parser rejects, so an untouched form can fail validation or lose the original amount if later clamped.
- Origin: Introduced by `HEAD` when whole-đồng rounding was added to `formatMoneyForInput()`; the parser's 13-digit storage guard predates this rounding path.
- Trigger / reproduction: `formatMoneyForInput('9999999999999.99')` extracts 13 integer digits and `.99`, `roundCentsToWholeDong()` increments them to `10000000000000`, and `groupMoneyDigits()` returns `10,000,000,000,000`. `parseMoneyInputToCanonicalDecimal()` rejects that display because `isStoragePrecisionSupported()` requires at most 13 integer digits.
- Expected behavior: Hydrating a valid stored amount must produce a display representation accepted by the parser and must preserve the original canonical amount at this overflow boundary. It must not display a rounded 14-digit value, clamp to the maximum whole amount, or return an empty value.
- Actual behavior: `formatMoneyForInput()` unconditionally returns the rounded overflow at `money-input.utils.ts:152-153`; the parser rejects 14 integer digits at `:99-102` and `:226-234`. The existing “very large numbers” test at `money-input.utils.test.ts:46-48` asserts an even wider rounded output without checking parser round-trip, masking the defect.
- Evidence: `frontend/src/lib/money-input.utils.ts:99-102, 124-128, 143-153, 219-234`; `frontend/src/lib/money-input.utils.test.ts:46-48` and `:198-205`; current form hydration/submit paths at `frontend/src/components/cards/card-form.tsx:318-336`, `transaction-form.tsx:89-100`, and `reconcile-form.tsx:53-60`.
- Counter-evidence considered: Ordinary `.50`/`.75` rounding tests pass, and the parser correctly rejects values that truly exceed `DECIMAL(15,2)`. The problem is specifically that rounding a valid 13-digit integer plus cents creates a larger value; rejecting the rounded result is not a safe response because the original stored value is valid and must not be silently changed.
- Why fixing is necessary: A maximum valid persisted amount can become an invalid form value on hydration. This violates the canonical round-trip contract and can block edits or reconciliation of otherwise valid records.
- Scope basis: This is a supporting correction to the same money-input hydration and serialization feature, using the existing `DECIMAL(15,2)` boundary. It does not broaden supported precision.
- Reviewer remedy assessment: Accept the preservation requirement and reject clamping or parser-limit relaxation. The smallest bounded fix is an overflow-aware branch around whole-đồng rounding that preserves a parser-compatible representation of the original stored amount only when rounding would exceed the 13-digit whole-input limit. Ordinary values continue to use the existing whole-đồng rounding.
- Minimal remediation: Add a boundary check after `roundCentsToWholeDong()`. When the rounded digit length exceeds `MONEY_INPUT_MAX_INTEGER_DIGITS`, return a grouped representation that still parses back to the original stored canonical decimal (for example, `9,999,999,999,999.99` for the stated boundary input). Add the corresponding parser round-trip test and a form-level untouched-hydration assertion if the chosen representation is retained in the input state.
- Compatibility and non-goals: Keep the existing `.50`/`.75` half-away-from-zero behavior for values whose rounded result fits; keep parser rejection for genuinely over-precision or over-wide inputs; do not clamp, silently truncate, relax the database precision, or change backend/API contracts.
- Dependencies / order: None in implementation, but OpenSpec reconciliation must precede source edits because the exceptional parser-compatible display may retain fractional text despite the archived normal display grammar.
- OpenSpec integration: The archived tasks `1.3` and `1.4` are complete and must not be edited. Because the user-requested preservation behavior is a narrow contract exception to the archived whole-đồng display decision, the implementing agent must create a new active change with `openspec-propose` (or otherwise reconcile an explicitly reopened active artifact) and record the boundary scenario before applying code.
- Acceptance criteria:
  - WHEN `formatMoneyForInput('9999999999999.99')` is hydrated, THEN its result is accepted by `parseMoneyInputToCanonicalDecimal()` and parses back to `9999999999999.99`; it is not the rounded 14-digit amount, empty, or clamped.
  - WHEN `formatMoneyForInput('50000000.50')` or `formatMoneyForInput('400000.75')` is called, THEN the existing outputs `50,000,001` and `400,001` remain unchanged.
  - WHEN a genuinely over-wide or over-precision value is supplied, THEN existing rejection behavior remains unchanged.
- Regression verification: Add a boundary round-trip case to `frontend/src/lib/money-input.utils.test.ts`, and add a focused form hydration/untouched-submit test if the fallback retains a decimal display. Run `pnpm --filter frontend test -- --runInBand src/lib/money-input.utils.test.ts` plus the affected form test.
- Plan task IDs: `2.1`, `2.2`, `2.3` below

### Findings not scheduled for fixing

None. All supplied findings were independently reproduced or established from a concrete parser/control-flow trace and are recommended for fixing.

### Unresolved findings and decisions

None under the decision matrix. RA-003 has a planning constraint, not an unresolved defect: the user-requested boundary-preservation behavior must be documented in a new active OpenSpec change because the matching change is archived and its normal display grammar is whole-đồng.

### Verification evidence and future checks

| Check | Phase | Command / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- | --- |
| Working-tree and revision inspection | Adjudication | `git status --short`; `git rev-parse HEAD`; `git diff --stat 50556e6...HEAD` | PASS | HEAD is `51e8665`; target files are clean; unrelated untracked `ytuong.md` remains out of scope; base `origin/main` resolves to `50556e6`. |
| OpenSpec context and change inventory | Adjudication | `openspec context --json`; `openspec list --json` | PASS | Local `spec-driven` root resolved; no active changes; matching money-input change is archived. |
| Current frontend money-input tests | Adjudication | `pnpm --filter frontend test -- --runInBand src/lib/money-input.utils.test.ts src/components/ui/money-input.test.tsx` | PASS | 2 suites and 53 tests passed. These suites do not cover Delete-before-minus, ignored edits on negative values, or the maximum-value round trip. |
| Frontend typecheck | Adjudication | `pnpm typecheck:frontend` | PASS | TypeScript completed with no diagnostics. |
| Frontend lint | Adjudication | `pnpm --filter frontend lint` | PASS | ESLint completed with no diagnostics. |
| Current OpenSpec validation | Adjudication | `openspec validate --specs --strict` | PASS | 6 specs passed; the CLI emitted two informational long-requirement notices. |
| Archived OpenSpec validation | Adjudication | `openspec validate --archived --strict` | PASS | 11 archived changes passed, including `2026-09-28-fix-money-input-ux`. |
| RA-001 control-flow reproduction | Adjudication | Manual trace of `handleKeyDown()` and `commit()` at `money-input.tsx:66, 118-125` | DEFECT REPRODUCED | `-2,500` with caret before `-` becomes `500`, deleting the leading digit. No new test was added during adjudication. |
| RA-002 control-flow reproduction | Adjudication | Manual trace of `commit()` and `sanitizeMoneyInputDigits()` at `money-input.tsx:65-86` and `money-input.utils.ts:165-182` | DEFECT REPRODUCED | An ignored character on `-2,500` sanitizes to the same negative digits, then unconditional sign removal makes it positive. |
| RA-003 parser-boundary reproduction | Adjudication | Manual trace of `roundCentsToWholeDong()`, `formatMoneyForInput()`, and `parseMoneyInputToCanonicalDecimal()` | DEFECT REPRODUCED | Valid `9999999999999.99` rounds to a 14-digit display that the parser rejects. |
| Future component regressions | Future implementation | `pnpm --filter frontend test -- --runInBand src/components/ui/money-input.test.tsx` | NOT RUN | Must assert sign-only Delete, ignored negative edits, real negative amount edits, and existing comma deletion. |
| Future utility/form regressions | Future implementation | Focused utils and affected form Jest commands | NOT RUN | Must assert boundary parser round-trip and untouched hydration/submission without changing ordinary rounding behavior. |

### Handoff instructions for the implementing agent

1. Read this report, the applicable `AGENTS.md`, current source, `openspec/config.yaml`, current main specs, and the archived `2026-09-28-fix-money-input-ux` artifacts. Revalidate all findings if the recorded revision or working-tree state has changed.
2. Implement only the `ACCEPTED_FIX` IDs selected by the user. “Fix the issues in this report” means RA-001, RA-002, and RA-003 only; there are no rejected or unresolved items to include.
3. Because the matching change is archived, use `openspec-propose` to establish a new active follow-up change before source edits. RA-001 and RA-002 restore the existing contract. RA-003 requires an explicit boundary scenario and design decision if the display retains fractional text to preserve a valid stored amount.
4. Transfer the selected checklist items below into the authoritative new `tasks.md` with report-ID mapping. Do not edit archived `proposal.md`, `design.md`, `specs/`, or `tasks.md` and do not mark future tasks complete in this report.
5. Follow the new change's schema instructions and then use `openspec-apply-change` or the equivalent implementation workflow. Keep the source changes minimal and preserve all non-target money-input behavior.
6. Run the focused regression tests, `pnpm typecheck:frontend`, `pnpm --filter frontend lint`, and the applicable strict OpenSpec validation. Record actual results and update only the authoritative active task ledger after acceptance criteria pass.

### Decisions requested from the user

- Authorize RA-001 and RA-002 as recommended MUST FIX work, and authorize RA-003 if preserving a valid maximum stored amount at the rounding boundary is desired.
- Confirm the RA-003 contract choice: the overflow case must preserve the original canonical amount in a parser-compatible display, which may retain its fractional text as a documented exceptional case despite normal whole-đồng display.
- No code or existing OpenSpec artifact changes were made during this adjudication.

## Proposed implementation checklist

Only ACCEPTED_FIX findings are eligible. All entries remain unchecked until authorized work is implemented and verified through the authoritative OpenSpec task ledger.

## 1. Delete and negative-sign behavior

- [ ] 1.1 [RA-001] Restrict `MoneyInput` Delete redirection to grouping commas or explicitly handle leading-minus deletion; verify Delete before `-2,500` removes only the sign while Delete before the comma still removes the following digit.
- [ ] 1.2 [RA-002] Compare sanitized unsigned amount digits with the current value before stripping the sign; preserve negative values for ignored edits, while allowing real amount edits and explicit sign deletion to remove the sign.
- [ ] 1.3 [RA-001, RA-002] Add `userEvent` regressions in `frontend/src/components/ui/money-input.test.tsx` for sign-only Delete, ignored edits on negative values, real edits on negative values, and preserved comma deletion; verify with the focused component test command.

## 2. Parser-safe maximum-value hydration

- [ ] 2.1 [RA-003] Create/reconcile an active OpenSpec follow-up documenting the maximum-value rounding-overflow scenario and the parser-compatible preservation rule before changing implementation code.
- [ ] 2.2 [RA-003] Update `formatMoneyForInput()` around `roundCentsToWholeDong()` so a rounded result beyond `MONEY_INPUT_MAX_INTEGER_DIGITS` preserves the original stored canonical amount instead of returning an unparseable overflow, clamp, or empty value; verify ordinary rounding and existing rejection behavior remain unchanged.
- [ ] 2.3 [RA-003] Add a maximum-boundary round-trip test to `frontend/src/lib/money-input.utils.test.ts` and, if needed for the chosen display representation, an untouched form hydration/submission test; verify focused Jest tests, frontend typecheck/lint, and strict OpenSpec validation.
