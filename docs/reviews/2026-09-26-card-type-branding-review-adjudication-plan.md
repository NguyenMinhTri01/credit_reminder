# Review Adjudication and Remediation Plan

- Report status: IMPLEMENTED — accepted remediations applied and verified under the user's explicit
  instruction to fix valid findings in the same request
- User implementation decision: APPROVED — "check if these issues are valid, if so fix them";
  applied RA-001, RA-003, RA-007, RA-009 only
- Adjudication coverage: COMPLETE — limited to the nine supplied review comments
- Review source: User-provided inline review comments across eight files, 2026-09-26
- Repository / branch: `credit_reminder` / `feat/card-type-selection-and-logos`
- Reviewed revision / current HEAD: `4b4e105` (merge of `main` into the feature branch)
- Diff base and working-tree scope: merge base with `origin/main` is `7a8e250`. Working tree was
  clean at adjudication start; no staged or untracked files were relevant.
- OpenSpec root / store: local repository root; no store
- Change / lifecycle / schema: no active change (`openspec list --json` returned an empty set); the
  reviewed work corresponds to archived `2026-09-12-add-card-type`,
  `2026-09-12-add-card-type-adjudication-remediation`, and `2026-09-12-card-type-form-fallback`;
  `spec-driven`
- Artifacts and standards read: `AGENTS.md`, `frontend/.windsurfrules`, `backend/.windsurfrules`,
  `openspec/config.yaml`, live `credit-card-crud` and `dashboard-overview` specs, all three archived
  card-type changes and their deltas, the affected source and test files, and the installed
  `@radix-ui/react-select` 2.3.7 distribution
- Structural-analysis method: CodeGraph was not consulted; targeted source inspection, `git` history
  analysis, and actual test execution were used instead.
- Language policy: English repository artifact; Vietnamese conversational summary; no override

### Decision summary

Four findings were verified as real and fixed. One is a demonstrable false positive: the test the
reviewer claims cannot work was executed and passes, and the cited Radix mechanism does not exist in
the installed version. Two findings rest on incorrect premises about what this branch changed or
about editing immutable artifacts. Two remain valid but out of the current scope, the more important
being an unspecified `cardType: null` update contract that genuinely warrants a follow-up change.

| ID | Original IDs | Claim | Affected feature | Decision | Severity | Why / next action |
| --- | --- | --- | --- | --- | --- | --- |
| RA-001 | `frontend/src/shared/utils/index.ts:78` | `delay` does not await an async callback | Shared delay utility | ACCEPTED_FIX | RECOMMEND | Real defect; async rejection escaped the returned promise. Fixed with regression tests. |
| RA-002 | `frontend/src/components/cards/card-form.test.tsx:133` | `fireEvent.click` cannot open a Radix Select | Card-form test suite | REJECTED_FALSE_POSITIVE | N/A | The suite passes; `pointerTypeRef` defaults to `"touch"`, so the `onClick` path opens the select. |
| RA-003 | `backend/src/shared/types/index.ts:1` | Missing blank line between import groups | Backend shared types | ACCEPTED_FIX | RECOMMEND | Matches an explicit `AGENTS.md` rule. Fixed. |
| RA-004 | `openspec/specs/credit-card-crud/spec.md:174` | Create-path validation scenarios are duplicated | Create-card contract | REJECTED_OVER_ENGINEERING | N/A | Deliberate layering; the proposed remedy would gut the canonical card-type requirement. |
| RA-005 | `openspec/specs/credit-card-crud/spec.md:198` | Legacy-edit contract does not state `cardType` serialization | Update-card contract | DEFERRED_OUT_OF_SCOPE | RECOMMEND | Technically confirmed against the DTO, but a live-spec edit requires an active OpenSpec change. |
| RA-006 | `openspec/changes/archive/2026-09-12-card-type-form-fallback/proposal.md:3` | The "Why" premise is inaccurate | Archived proposal | INFORMATIONAL_NOTE | N/A | The claim is correct, but archived artifacts are immutable historical records. |
| RA-007 | `.agents/skills/review-adjudication/references/report-template.md:124` | Trailing sections nest inside a numbered task group | Adjudication skill template | ACCEPTED_FIX | RECOMMEND | Real structural defect that contradicts the template's own stated rule. Fixed. |
| RA-008 | `frontend/src/components/cards/card-tile.tsx:142` | This PR adds an unrelated 100ms delay to the delete action | Card-tile delete flow | DEFERRED_OUT_OF_SCOPE | RECOMMEND | Scope premise is false: the line already exists on `origin/main`. Concerns are valid but pre-existing. |
| RA-009 | `docs/reviews/2026-09-12-add-card-type-adjudication-plan.md:134` | Evidence labeled "Current" describes a superseded state | Review documentation | ACCEPTED_FIX | RECOMMEND | All four cited drifts confirmed. Relabeled and pinned to the reviewed revision. |

- Input findings: 9; normalized findings: 9; duplicate/split mapping: none — each supplied violation
  maps one-to-one to an RA ID
- ACCEPTED_FIX: 4
- REJECTED_FALSE_POSITIVE: 1
- REJECTED_OVER_ENGINEERING: 1
- DEFERRED_OUT_OF_SCOPE: 2
- INFORMATIONAL_NOTE: 1
- NEEDS_EVIDENCE: 0

### OpenSpec scope and traceability

- In scope: correctness of the shared `delay` helper, documented import-grouping standards, the
  adjudication skill's own template, and accuracy of the supplementary review record. None of these
  alter an observable product contract.
- Out of scope: live `credit-card-crud` requirement wording (RA-005), archived proposal history
  (RA-006), and the pre-existing delete-dialog timing workaround inherited from `origin/main`
  (RA-008).
- Binding decisions and contract conflicts: no live requirement governs the shared `delay` helper or
  the skill template. RA-005 exposes a genuine gap between the live update requirement and
  `UpdateCreditCardDto`'s validation behavior; that gap is recorded, not silently resolved.

| Finding | Capability / spec path | Requirement → scenario | Proposal / design basis | Existing task | Contract effect |
| --- | --- | --- | --- | --- | --- |
| RA-001 | N/A — internal utility | N/A | `AGENTS.md` "Never swallow errors"; `backend/.windsurfrules` "Never floating promises" | N/A — no active change | None; restores intended helper semantics |
| RA-003 | N/A — code style | N/A | `AGENTS.md` "Imports & Exports" group ordering | N/A | None |
| RA-007 | `shared-agent-skills` | N/A — internal template structure | `.agents/skills/review-adjudication/SKILL.md` §5 heading-level rule | N/A | None; aligns the template with its own rule |
| RA-009 | N/A — supplementary documentation | N/A | Precedent set by `2026-09-12-card-type-form-fallback` proposal, which updated this same document | N/A | None |
| RA-005 | `credit-card-crud` | Card type is exposed with legacy-safe card responses → Legacy card remains editable | Requires a new change | N/A | Proposed artifact change, deferred |

### Accepted findings — recommended for fixing

#### RA-001 — `delay` resolves before an async callback settles

- Decision: ACCEPTED_FIX
- Original finding: `frontend/src/shared/utils/index.ts:78`; `func?.()` is not awaited, so an async
  callback's rejection bypasses the `catch` and `delay` resolves immediately. Reviewer severity P3.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. No current caller passes an async
  function, so there is no live user-facing failure; this is a latent trap in a shared helper whose
  signature openly invites `() => Promise<unknown>`.
- Project finding code: N/A — implementation defect with no governing OpenSpec scenario.
- Affected feature and impact: the shared `delay` helper in `frontend/src/shared/utils`. The only
  production caller is `card-tile.tsx:142`, which passes a synchronous callback, so no shipped flow
  misbehaves today.
- Origin: pre-existing. Introduced by `915ef5d` and already present on `origin/main`; not a
  regression from the card-type branding work.
- Trigger / reproduction: `delay(100, async () => { throw new Error('x') })`. Before the fix the
  returned promise resolved and the rejection surfaced as an unhandled rejection.
- Expected behavior: the returned promise mirrors the callback's outcome for both synchronous throws
  and asynchronous rejections.
- Actual behavior: `resolve()` ran on the same tick the callback was invoked, discarding its promise.
- Evidence: a new test, `should reject when an async callback rejects`, failed against the original
  implementation with "Received promise resolved instead of rejected", then passed after the fix.
- Counter-evidence considered: the existing suite covered synchronous throws only, so its green
  status did not disprove the claim. The narrow `() => unknown` signature is exactly what makes the
  async case reachable without a type error.
- Why fixing is necessary: a shared promise-returning utility that silently swallows async failures
  will mislead the next caller, and unhandled rejections are diagnostically expensive.
- Scope basis: minimal correctness repair of a file already touched on this branch; no contract moves.
- Reviewer remedy assessment: the intent (`await func?.()`) is correct, but a bare `await` inside a
  non-async `setTimeout` callback is invalid. Implemented equivalently by normalizing the callback
  result through a promise, which keeps synchronous-throw behavior identical.
- Minimal remediation: in `delay`, settle the returned promise from
  `(async () => func?.())().then(() => resolve(), reject)`.
- Compatibility and non-goals: preserved the timer semantics, the `void`-return contract, and the
  existing synchronous-throw rejection. Did not change the signature or any call site.
- Dependencies / order: none.
- OpenSpec integration: no requirement change; no active change exists to record a task against.
- Acceptance criteria:
  - WHEN the callback returns a rejected promise, THEN `delay`'s promise rejects with that reason.
  - WHEN the callback returns a pending promise, THEN `delay`'s promise stays pending until it settles.
  - WHEN the callback throws synchronously, THEN the previous rejection behavior is unchanged.
- Regression verification: `frontend/src/shared/utils/index.test.ts` gained
  `should not resolve until an async callback settles` and
  `should reject when an async callback rejects`; verified with `npx jest src/shared/utils`.
- Plan task IDs: 1.1, 1.2

#### RA-003 — External and internal imports are not separated

- Decision: ACCEPTED_FIX
- Original finding: `backend/src/shared/types/index.ts:1`; the `@prisma/client` import abuts the
  internal `../enums` import with no blank line. Reviewer severity P3.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. Style-only, but the rule is explicit.
- Project finding code: N/A — project standard rather than a spec scenario.
- Affected feature and impact: none at runtime; readability and convention consistency only.
- Origin: introduced by the card-type work that added the `CardType` import.
- Trigger / reproduction: read lines 1-3 of the file.
- Expected behavior: `AGENTS.md` requires "Built-in → External → Internal (shared) → Local" groups
  separated by blank lines.
- Actual behavior: external and internal imports formed one contiguous block.
- Evidence: `AGENTS.md` "Imports & Exports"; the file's first three lines before the fix.
- Counter-evidence considered: ESLint does not enforce import grouping here, so nothing flagged it;
  the documented standard still applies.
- Why fixing is necessary: it is a one-line alignment with a written project rule.
- Scope basis: the same import block this branch modified.
- Reviewer remedy assessment: accepted verbatim.
- Minimal remediation: insert a blank line after the `@prisma/client` import.
- Compatibility and non-goals: no reordering of other imports and no behavior change.
- Dependencies / order: none.
- OpenSpec integration: none required.
- Acceptance criteria:
  - WHEN the file is read, THEN the external import is separated from internal imports by a blank line.
  - WHEN the backend is type-checked and linted, THEN both pass.
- Regression verification: `npx tsc --noEmit` and `npx eslint src/shared/types/index.ts`, both clean.
- Plan task IDs: 2.1

#### RA-007 — Template's trailing sections nest inside a numbered task group

- Decision: ACCEPTED_FIX
- Original finding: `report-template.md:124`; the three trailing `###` sections sit after the last
  `## N.` group, so Markdown nests them under it. Reviewer severity P3.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. It corrupts the structure of every report
  this skill generates.
- Project finding code: N/A — internal tooling artifact.
- Affected feature and impact: all future adjudication reports, whose task groups stop being
  self-contained and whose verification/handoff content is misfiled under "task group 2".
- Origin: introduced by `fa51989`, the commit that refactored this skill.
- Trigger / reproduction: parse the template's heading tree; `### Verification evidence` at former
  line 124 resolves as a child of `## 2.`.
- Expected behavior: per the template's own preamble, the checklist "uses a level-two heading so task
  groups are not nested under a deeper section", and per `SKILL.md` §5 non-task sections must sit at
  other heading levels so groups are unambiguous.
- Actual behavior: the checklist heading was `###` while its groups were `##`, and three `###`
  sections trailed the groups.
- Evidence: the pre-fix heading sequence `### Proposed implementation checklist` → `## 1.` → `## 2.`
  → `### Verification evidence` → `### Handoff instructions` → `### Decisions requested`.
- Counter-evidence considered: the whole body sits inside a fenced block, so no renderer breaks
  today; the defect still propagates into every generated report, which is not fenced.
- Why fixing is necessary: the template is the contract for report structure; leaving it
  self-contradictory guarantees repeated malformed reports.
- Scope basis: the skill file already being corrected on this branch.
- Reviewer remedy assessment: adopted the reviewer's first option, with one addition the review
  omitted — promoting the checklist heading to `##` as the template's own preamble already requires.
- Minimal remediation: move the three trailing sections above the checklist and promote
  `Proposed implementation checklist` to a level-two heading, leaving the numbered groups last.
- Compatibility and non-goals: preserved all wording, the `- [ ] N.M` syntax, and the fence.
- Dependencies / order: none.
- OpenSpec integration: none; this is skill tooling, not a spec artifact.
- Acceptance criteria:
  - WHEN the heading tree is parsed, THEN no non-task section follows a `## N.` group.
  - WHEN `pnpm skills:check` runs, THEN the skill layout remains valid.
- Regression verification: heading-sequence inspection plus `pnpm skills:check` (16/16 passing).
- Plan task IDs: 3.1

#### RA-009 — Evidence labeled "Current" describes a superseded state

- Decision: ACCEPTED_FIX
- Original finding: `2026-09-12-add-card-type-adjudication-plan.md:134` and three sibling citations
  describe the pre-remediation state while labeled "current". Reviewer severity P3.
- Reviewer severity / adjudicated severity: P3 / RECOMMEND. The record contradicts the files it
  describes.
- Project finding code: `[OS-DOC-DRIFT]`.
- Affected feature and impact: a reader auditing the completed remediation finds evidence that
  asserts the remediation never happened.
- Origin: introduced when the remediation landed without updating the report's evidence tense.
- Trigger / reproduction: compare each citation against the current checkout.
- Expected behavior: evidence describing a superseded state is labeled as such or pinned to a revision.
- Actual behavior: all four claims were stale, and every sub-claim in the review checked out:
  `card-type-logo.test.tsx` lines 34-58 now hold the dimension assertions the report says are absent;
  `credit-cards-dto.spec.ts:43–63` now asserts exactly one `isEnum` constraint; live `spec.md:193–195`
  now requires explicit `cardType: null`; and the update DTO test moved to lines 204-212.
- Evidence: direct reads of `frontend/src/components/cards/card-type-logo.test.tsx`,
  `backend/src/credit-cards/dto/credit-cards-dto.spec.ts`, and
  `openspec/specs/credit-card-crud/spec.md`.
- Counter-evidence considered: the document is historical, which argues against edits. But it is a
  supplementary report in `docs/`, not an OpenSpec artifact or archive, and the
  `2026-09-12-card-type-form-fallback` proposal already set the precedent of correcting this exact
  file for accuracy.
- Why fixing is necessary: an "IMPLEMENTED" report whose evidence denies the implementation is
  actively misleading.
- Scope basis: documentation accuracy for the change this branch completes.
- Reviewer remedy assessment: accepted; used the "pin to the reviewed revision" option because the
  document already records that revision.
- Minimal remediation: relabel the four citations as "at review time (`3958ed6`)" and shift the
  surrounding claims to past tense.
- Compatibility and non-goals: kept the original line ranges as the historical record; did not
  restate decisions, severities, or outcomes.
- Dependencies / order: none.
- OpenSpec integration: none; supplementary documentation only.
- Acceptance criteria:
  - WHEN a citation describes pre-remediation state, THEN it is pinned to `3958ed6` and reads as past.
  - WHEN the report's decisions are read, THEN they are unchanged.
- Regression verification: documentation-only; `npx openspec validate --specs --strict` still passes.
- Plan task IDs: 4.1

### Findings not scheduled for fixing

#### RA-002 — "`fireEvent.click` does not open a Radix Select in jsdom"

- Decision: REJECTED_FALSE_POSITIVE
- Original finding: `card-form.test.tsx:133`; claims `SelectContent` never mounts, so
  `toHaveLength(5)` fails and the logo test passes vacuously. Suggests pointer events or
  `userEvent`. Reviewer severity P2.
- Adjudicated severity / project code: N/A / N/A.
- Affected feature and actual behavior: none. `npx jest src/components/cards/card-form.test.tsx`
  reports 17/17 passing, including `offers exactly the five supported card types`.
- Evidence and contract basis: in installed `@radix-ui/react-select` 2.3.7,
  `node_modules/@radix-ui/react-select/dist/index.mjs:165` initializes `pointerTypeRef` to `"touch"`,
  and the trigger's `onClick` at `:202–207` calls `handleOpen(event)` whenever
  `pointerTypeRef.current !== "mouse"`. A bare `fireEvent.click` never sets that ref, so it takes the
  open path. `onPointerDown` at `:208` is the mouse-specific path, not the general one.
- Independent reasoning: the review's central mechanism does not exist in this version — there is no
  `pointerDownRef` anywhere in the package, and `onClick` is not a legacy WebKit-only fallback. The
  argument is also internally inconsistent: if no option mounted, `getAllByRole('option')` would
  throw and the second test would fail loudly rather than "pass vacuously". The reviewer appears to
  have reasoned from an older Radix implementation rather than the installed one.
- Consequence of leaving unchanged: none. Rewriting these tests to dispatch synthetic pointer events
  would add jsdom-specific ceremony without changing what is verified.
- Disposition: no change.
- Reconsider only if: `@radix-ui/react-select` is upgraded to a version that gates opening on a
  pointer-down ref, at which point the suite will fail and show it directly.

#### RA-004 — "Create-path validation scenarios are duplicated"

- Decision: REJECTED_OVER_ENGINEERING
- Original finding: `spec.md:174`; the create requirement's "Validation rejects invalid input" and the
  card-type requirement's create scenarios both cover rejection, so they may diverge. Proposes
  keeping create coverage in one place and leaving only the update-only scenario in the new
  requirement. Reviewer severity P3.
- Adjudicated severity / project code: N/A / N/A.
- Affected feature and actual behavior: documentation cohesion only; both statements are currently
  accurate and mutually consistent.
- Evidence and contract basis: `spec.md:39–41` lists `cardType` among many fields in one compound
  endpoint-level validation scenario; `:167–184` is the dedicated, field-level card-type requirement.
- Independent reasoning: the overlap is ordinary spec layering — one requirement describes the create
  endpoint's validation surface, the other is the single canonical home for card-type behavior.
  Applying the proposed remedy would strip create coverage from precisely the requirement a reader
  consults to learn the card-type contract, leaving it describing updates only. That trades a
  speculative divergence risk for a concrete loss of locality. The divergence argument is also weak:
  the generic scenario names no enum values, so the two cannot contradict on the supported set.
- Consequence of leaving unchanged: two requirements continue to mention create-time rejection, which
  is normal and readable.
- Disposition: no change. Any future consolidation belongs to a deliberate spec-clarity change, not
  to this branch.
- Reconsider only if: the two statements actually diverge on observable behavior.

#### RA-005 — Legacy-edit contract does not state `cardType` serialization

- Decision: DEFERRED_OUT_OF_SCOPE
- Original finding: `spec.md:198`; "Legacy card remains editable" never says what the update payload
  must contain, and since `cardType: null` is rejected, omission is the only safe serialization.
  Reviewer severity P3.
- Adjudicated severity / project code: RECOMMEND / `[OS-DOC-DRIFT]`. The concern is legitimate.
- Affected feature and actual behavior: the reviewer's technical reading is confirmed.
  `backend/src/credit-cards/dto/update-credit-card.dto.ts:31–33` applies
  `@ValidateIf((_object, value) => value !== undefined)` with `@IsEnum(CardType)`, so `null` passes
  the guard and then fails the enum check. A client that "clears" a legacy card's type by sending
  `cardType: null` receives a validation error, and the live spec never warns of this.
- Evidence and contract basis: the DTO above; live requirement at `spec.md:186–199`; the update DTO
  test at `credit-cards-dto.spec.ts:204–212` covers only a valid value and `'DISCOVER'`, so null is
  untested at this boundary.
- Independent reasoning: this is a real API-boundary ambiguity, but the remedy is a wording change to
  a live requirement in `openspec/specs/`. `openspec list --json` shows no active change, and both
  `AGENTS.md` and this skill route contract edits through `openspec-propose` /
  `openspec-update-change`. Editing a live spec directly while adjudicating would bypass the workflow
  and silently widen this branch's scope, so I deliberately left it untouched.
- Consequence of leaving unchanged: low but non-zero — a future client or generated SDK could send
  `cardType: null` on a legacy edit and hit an unexplained 400. Nothing in the shipped frontend does
  this, because `card-form.tsx` submits a supported enum value or omits the field.
- Disposition: recommend a small follow-up change stating that updates omitting `cardType` leave the
  stored value unchanged and that `null` is not an accepted update value, ideally adding a null-case
  DTO test. Requires your go-ahead to create the change.
- Reconsider only if: you authorize a spec change, or the update DTO starts accepting `null`.

#### RA-006 — Archived proposal's "Why" premise is inaccurate

- Decision: INFORMATIONAL_NOTE
- Original finding: archived `card-type-form-fallback/proposal.md:3`; the fallback promise did not
  pre-exist, so "the live contract and the UI are inconsistent" describes a state this change itself
  created. Asks to reword. Reviewer severity P3.
- Adjudicated severity / project code: N/A / N/A.
- Affected feature and actual behavior: the reviewer is substantively right. The fallback clause in
  the card-form requirement arrives as a `## MODIFIED Requirements` block in this change's own delta,
  and the live `credit-card-crud` card-form requirement carried no fallback wording beforehand.
- Evidence and contract basis: `card-type-form-fallback/specs/credit-card-crud/spec.md` introduces
  the clause. One nuance the review missed: the earliest archived delta,
  `2026-09-12-add-card-type/specs/dashboard-overview/spec.md:5`, did promise a safe fallback for
  "any card selector that displays card information", which plausibly covered the form trigger. The
  later remediation narrowed that to "card list, card detail view, and dashboard card"
  (`openspec/specs/dashboard-overview/spec.md:98`), so by the time of this change no live requirement
  covered the form trigger. The conclusion holds; the history is less clear-cut than stated.
- Independent reasoning: correctness of the claim does not justify the remedy. This is an archived
  proposal — an immutable record of the reasoning at that time. Both `SKILL.md` §6 and this project's
  own precedent (RA-001/RA-003 in the prior plan) forbid rewriting archived history, and retroactively
  polishing a "Why" is exactly the edit that erases how a decision was actually reached.
- Consequence of leaving unchanged: an archived proposal overstates its premise. No live contract,
  code path, or test is affected.
- Disposition: no change; recorded here so the imprecision is visible without altering the archive.
- Reconsider only if: the project adopts an explicit errata mechanism for archived proposals.

#### RA-008 — 100ms delay on the delete action

- Decision: DEFERRED_OUT_OF_SCOPE
- Original finding: `card-tile.tsx:142`; "This change wraps the delete-dialog open in an arbitrary
  100ms delay, which is unrelated to the card-type branding in this PR", calling it scope creep, a
  fragile timing workaround, and a fire-and-forget promise. Asks to revert to a synchronous call.
  Reviewer severity P3.
- Adjudicated severity / project code: RECOMMEND / N/A — the code concerns are fair; the scope framing
  is not.
- Affected feature and actual behavior: opening the delete confirmation from the card menu is delayed
  by a fixed 100ms, and `delay`'s promise is not consumed.
- Evidence and contract basis: the scope claim is disproved by history. The line was introduced by
  `915ef5d` ("fix dropdown menu race condition") and merged to `origin/main` via `7a8e250`, which is
  this branch's merge base. `git show origin/main:frontend/src/components/cards/card-tile.tsx:132`
  contains the identical call, and `git diff 7a8e250 HEAD -- frontend/src/components/cards/card-tile.tsx`
  touches only the `CardTypeLogo` import, the card-type label, and the header layout — never the
  delete menu item. The reviewer read a merge artifact as this branch's work.
- Independent reasoning: on the technical merits the reviewer has a point — a magic 100ms sleep is a
  weak fix for a render race, and the inconsistency with the adjacent synchronous Edit item is real.
  But this is pre-existing `main` behavior that a prior change made deliberately, so reverting it here
  would silently undo another PR's bug fix from inside an unrelated feature branch. The race is also
  plausible rather than imaginary: `DeleteCardDialog` is a modal Radix `AlertDialog`
  (`delete-card-dialog.tsx:41`) opened as a `DropdownMenu` closes, the well-known case where the
  menu's cleanup can leave `pointer-events: none` on `body`. I could not reproduce or refute it in
  jsdom, so I will not remove the guard on reasoning alone.
- Consequence of leaving unchanged: 100ms of added latency on a non-destructive dialog open (the
  actual deletion still requires explicit confirmation) and an unconsumed promise that, after the
  RA-001 fix, can no longer hide an async rejection.
- Disposition: recommend a separate frontend change that replaces the sleep with Radix's documented
  pattern — `onSelect={(event) => event.preventDefault()}` on the menu item, or deferring the state
  update to the menu's `onCloseAutoFocus` — verified in a real browser against the original race, and
  applied consistently with the Edit item. Not appropriate to bundle into the card-type branding work.
- Reconsider only if: you want that follow-up now, or manual browser testing shows the dialog opens
  cleanly without the delay.

### Unresolved findings and decisions

| ID | Claim / affected feature | Evidence checked | Missing evidence or conflict | Specific next check / user decision | Implementation impact |
| --- | --- | --- | --- | --- | --- |
| None | — | — | — | — | — |

All nine findings reached a decision. The only open questions are the two authorization decisions
recorded under RA-005 and RA-008.

### Verification evidence and future checks

| Check | Phase | Command / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- | --- |
| Radix Select claim | Adjudication | `npx jest src/components/cards/card-form.test.tsx` | PASS | 17/17 passing, disproving RA-002 |
| Radix trigger mechanism | Adjudication | Read `@radix-ui/react-select@2.3.7` dist lines 156-232 | PASS | `pointerTypeRef` defaults to `"touch"`; no `pointerDownRef` exists |
| RA-001 defect reproduction | Adjudication | `npx jest src/shared/utils/index.test.ts` before fix | FAIL (expected) | "Received promise resolved instead of rejected" |
| RA-001 fix | Implementation | `npx jest src/shared/utils` | PASS | 20/20, including both new async cases |
| Full frontend suite | Implementation | `npx jest` (frontend) | PASS | 70 suites, 368 tests |
| Frontend types / lint / format | Implementation | `npx tsc --noEmit`; `npx eslint`; `npx prettier --check` | PASS | Also cleared a pre-existing stray blank line in the touched file |
| Backend types / lint | Implementation | `npx tsc --noEmit`; `npx eslint src/shared/types/index.ts` | PASS | Clean |
| Skill layout | Implementation | `pnpm skills:check` | PASS | 16/16; layout valid after the template restructure |
| OpenSpec specs | Implementation | `npx openspec validate --specs --strict` | PASS | 6 passed, 0 failed; validates structure, not behavior |
| RA-008 race reproduction | NOT RUN | Manual browser check of the delete dialog without the delay | NOT RUN | Requires a running dev server; jsdom cannot show the `pointer-events` race |
| Backend test suite | NOT RUN | `pnpm test` (backend) | NOT RUN | The backend edit is a blank line; types and lint were verified instead |

### Handoff instructions for the implementing agent

1. Read this report, current code, `AGENTS.md`, and `openspec/config.yaml`. Revalidate findings if
   HEAD has moved past `4b4e105`.
2. RA-001, RA-003, RA-007, and RA-009 are already implemented and verified; do not reapply them.
   RA-002, RA-004, and RA-006 are closed and must not be "fixed" by a later agent — re-read their
   counter-evidence before reopening.
3. Only two items remain, and each needs explicit user authorization first:
   - RA-005: create an active change via `openspec-propose` (suggested id `clarify-card-type-update-contract`)
     that modifies the `credit-card-crud` requirement "Card type is exposed with legacy-safe card
     responses", stating that an update omitting `cardType` leaves the stored value unchanged and that
     `null` is not accepted. Add a null-rejection case to
     `backend/src/credit-cards/dto/credit-cards-dto.spec.ts`. Never edit `openspec/specs/` directly.
   - RA-008: create a separate frontend change to replace the `delay(100, …)` workaround in
     `card-tile.tsx:142` with Radix's documented dropdown-to-dialog pattern, verified manually in a
     browser against the original race before removing the guard.
4. Record the report IDs against the resulting OpenSpec tasks. This report is supplementary planning
   documentation; it does not replace proposal/specs/design/tasks and is not consumed by apply.
5. Use `openspec-apply-change` once the required planning and user decisions are satisfied.
6. Run `pnpm test`, `pnpm lint`, and the relevant `openspec validate` command, and mark tasks complete
   only when their acceptance criteria actually pass.

### Decisions requested from the user

- RA-005: authorize a small OpenSpec change to pin down the `cardType` update contract, or accept the
  current ambiguity?
- RA-008: authorize a separate frontend change to replace the 100ms delete-dialog delay with Radix's
  documented pattern, or leave `main`'s existing workaround in place?
- Accepted fixes RA-001, RA-003, RA-007, and RA-009 were applied under your instruction to fix valid
  findings. No live OpenSpec spec, archived artifact, or unrelated code was modified.

## Proposed implementation checklist

All items below are already implemented and verified; they are recorded for traceability. Remaining
recommendations (RA-005, RA-008) are deliberately absent because they are not authorized.

## 1. Shared delay utility correctness

- [x] 1.1 [RA-001] Settle `delay`'s promise from the callback's result in
      `frontend/src/shared/utils/index.ts`; verified by `npx jest src/shared/utils` (20/20).
- [x] 1.2 [RA-001] Add pending-promise and async-rejection cases to
      `frontend/src/shared/utils/index.test.ts`; verified failing pre-fix, passing post-fix.

## 2. Backend import convention

- [x] 2.1 [RA-003] Separate the `@prisma/client` import from internal imports in
      `backend/src/shared/types/index.ts`; verified by `npx tsc --noEmit` and `npx eslint`.

## 3. Adjudication template structure

- [x] 3.1 [RA-007] Move the verification, handoff, and decision sections above the checklist and
      promote it to a level-two heading; verified by heading inspection and `pnpm skills:check`.

## 4. Review record accuracy

- [x] 4.1 [RA-009] Pin the four superseded citations in
      `docs/reviews/2026-09-12-add-card-type-adjudication-plan.md` to `3958ed6` and shift them to past
      tense; verified by re-reading each cited file.
