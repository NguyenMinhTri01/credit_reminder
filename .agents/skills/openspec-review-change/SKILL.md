---
name: openspec-review-change
description: Code Review & Spec Verification for an OpenSpec change. Verifies that the implemented code matches the delta specs, proposal, design and tasks under `openspec/changes/`, and blocks scope creep. Use when the user asks to review a change, verify an implementation against its spec, or before archiving. Never edits production code.
allowed-tools: Bash(openspec:*), Bash(git:*)
license: MIT
compatibility: Requires openspec CLI and a git repository.
metadata:
  author: credit-reminder
  version: "1.0"
---

Review an implementation against its OpenSpec change and report the verdict.

> **Prime directive:** the specification is the source of truth, not the code.
> When code and spec disagree, that is a defect to report — never a reason to
> silently "fix" the spec or rationalize the code.

**Store selection:** If the user names a store, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on every command below that reads specs or changes (`status`, `list`, `show`, `validate`, `instructions`, `view`, `context`). Treat `--store <id>` as sticky for the rest of the workflow. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally a change name (e.g. `/openspec-review-change add-credit-dashboard`). If omitted, infer from conversation context or from the current git branch; auto-select when exactly one active change exists; otherwise run `openspec list --json` and ask.

**Mode**: Read-only with respect to source code. This skill produces a report. It MUST NOT modify implementation files, and MUST NOT modify planning artifacts unless the user explicitly asks for a follow-up fix.

---

## 1. Purpose

Guarantee that the delivered code matches the approved change **100%** — no less (missing requirements), and no more (unrequested features).

| Goal | Question answered |
| --- | --- |
| Spec conformance | Does every `ADDED` / `MODIFIED` / `REMOVED` requirement exist in code, with its scenarios honored? |
| Scope containment | Does the diff contain anything the `proposal.md` never authorized? |
| Architectural fidelity | Does the code follow the decisions recorded in `design.md`? |
| Task honesty | Do the `- [x]` checkboxes in `tasks.md` reflect reality? |
| Engineering quality | Are edge cases, security and performance handled at an acceptable standard? |

---

## 2. Inputs

Collect **all** of the following before writing a single line of the report. Missing input is itself a finding, not a reason to guess.

| # | Input | How to obtain | Required |
| --- | --- | --- | --- |
| 1 | Change metadata & artifact paths | `openspec status --change "<name>" --json` | Yes |
| 2 | `proposal.md` (Why / What Changes / Capabilities / Impact) | path from `contextFiles` | Yes |
| 3 | Delta specs (`specs/<capability>/spec.md`) | path from `contextFiles` | Yes |
| 4 | `design.md` (target architecture, decisions, trade-offs) | path from `contextFiles` | If present |
| 5 | `tasks.md` (checkbox state) | path from `contextFiles` | Yes |
| 6 | Current main specs (pre-change baseline) | `openspec/specs/<capability>/spec.md` | For `MODIFIED` / `REMOVED` deltas |
| 7 | Git diff of the implementation | see snippet below | If a base ref exists |
| 8 | Actual source code at HEAD | read the touched files in full, not only the diff hunks | Yes |
| 9 | Coding standards | `CODING_STANDARDS.md`; if absent, fall back to `.windsurfrules`, then `AGENTS.md`, then `README.md` | Yes (best available) |
| 10 | Project context / per-artifact rules | `openspec/config.yaml` (`context`, `rules`) | Yes |

```bash
openspec status --change "<name>" --json
openspec show   "<name>" --json --deltas-only
openspec validate "<name>" --strict

# Diff scope: prefer the merge-base against the integration branch
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)
git diff --stat "$BASE"...HEAD
git diff        "$BASE"...HEAD
```

> If no usable base ref exists, state that explicitly in the report header and
> review against the working tree only. Never invent a diff.

---

## 3. Steps

### Step 1 — Read the spec and the target architecture

1. Run `openspec status` and `openspec instructions apply --change "<name>" --json`; read **every** path under `contextFiles`.
2. Read `proposal.md` and extract two lists verbatim:
   - **In scope** — each bullet under `## What Changes` and each capability under `## Capabilities`.
   - **Out of scope** — anything under `Non-goals`, plus every deferral phrased as "not in this change", "no behavior yet", "no CRUD", etc.
3. Read `design.md` and record the binding decisions (layering, ownership, data flow, chosen primitives, rejected alternatives).
4. Read `openspec/config.yaml` `context` + `rules` and treat them as mandatory review criteria.
5. Build the **Requirement Inventory** — one row per `### Requirement:` and one sub-row per `#### Scenario:`. This inventory drives Step 2; do not shorten it.

> Do not start reading implementation code until the inventory exists. Reading
> code first anchors the review on what was built instead of on what was agreed.

### Step 2 — Compare code against the Delta Spec

Walk the inventory in order. For each requirement, locate the concrete implementation (file + symbol + line range) and classify it.

| Delta type | What MUST be true in code | Typical failure |
| --- | --- | --- |
| `ADDED` | New behavior exists and every scenario's `WHEN → THEN` is reachable and correct. | `[OS-SPEC-MISSING]` |
| `MODIFIED` | Old behavior is replaced by the new wording; no caller still relies on the old contract. | `[OS-SPEC-MISMATCH]` |
| `REMOVED` | Behavior, its routes/UI entry points, its tests and its dead helpers are gone. | `[OS-SPEC-STALE]` |

For each scenario ask, in this order:

1. **Exists?** Is there code that implements it at all?
2. **Faithful?** Does it implement the *specified* semantics, not an approximation?
3. **Reachable?** Is it wired into a route/handler/component actually used by the product?
4. **Proven?** Is there a test that asserts this scenario (`*.spec.ts` backend, `*.test.ts` frontend)?

Then run the scope pass in the opposite direction — from the diff back to the proposal:

```
for each changed file/symbol in the diff:
    if it does not trace to a requirement, a task, or an explicitly stated Impact  →  [OS-SCOPE-CREEP]
```

Finally, cross-check `tasks.md`: any `- [x]` whose behavior you could not find in code is `[OS-TASK-DRIFT]`; any implemented behavior with no corresponding task is a scope signal.

### Step 3 — Edge cases, security and performance

Only after conformance is established. Findings here are quality issues, not spec issues, unless a scenario explicitly covers them.

**Edge cases**
- Empty / zero / single-element / very large collections.
- `null`, `undefined`, and absent optional fields — especially where the spec says a value "remains undefined".
- Division by zero, `NaN`, `Infinity`, and clamping of percentages.
- Boundary values, timezone and date-boundary behavior, concurrency and repeated submits.
- Loading / empty / error states for every async surface.

**Security**
- Authentication on every new endpoint; authorization scope derived from the **server-side session/JWT**, never from a client-supplied id.
- Per-user data isolation in every query touching user-owned records.
- Input validation at the boundary (Zod / class-validator); no `any` escape hatches.
- No secrets in code, logs, responses, or client-rendered DOM.
- Output encoding / sanitization for user-controlled content; correct CORS.

**Performance**
- N+1 queries, unbounded result sets, missing pagination, missing indexes on new filters.
- Redundant re-renders, missing memoization on expensive derivations, missing lazy loading on new routes.
- Bundle impact of any newly added dependency.

**Standards** — apply the file from input #9 plus the repository rules: strict TypeScript, explicit return types, no `any`, named exports, no barrel files, no hardcoded user-facing strings (must live in constants / i18n), naming conventions, and Conventional Commit messages.

### Step 4 — Emit the review report

Produce the report exactly in the format of section 5. Rules:

- Every finding carries a **code**, a **file reference**, and the **spec clause or proposal bullet** it violates.
- Every `MUST FIX` finding names a concrete remediation.
- Do not invent findings to appear thorough; an empty `MUST FIX` section is a valid and good outcome.
- The `Praise` section is mandatory and must cite something specific — it calibrates the rest of the review.
- End with a single explicit verdict.

---

## 4. Finding Codes

| Code | Severity | Meaning |
| --- | --- | --- |
| `[OS-SPEC-MISSING]` | MUST FIX | A requirement or scenario in the delta spec has no implementation. |
| `[OS-SPEC-MISMATCH]` | MUST FIX | Implementation exists but its behavior contradicts the specified `WHEN → THEN`. |
| `[OS-SPEC-STALE]` | MUST FIX | Behavior marked `REMOVED` still exists, or an old contract survives a `MODIFIED` delta. |
| `[OS-SCOPE-CREEP]` | MUST FIX | Code delivers behavior the `proposal.md` never authorized, or that it explicitly deferred. |
| `[OS-TASK-DRIFT]` | MUST FIX | `tasks.md` claims completion that the code does not support (or vice versa). |
| `[OS-ARCH-VIOLATION]` | MUST FIX | Implementation contradicts a binding decision in `design.md`. |
| `[OS-SECURITY]` | MUST FIX | Authn/authz gap, data leak, missing validation, or exposed secret. |
| `[OS-EDGE-CASE]` | MUST FIX / RECOMMEND | Unhandled boundary condition. MUST FIX when a scenario covers it. |
| `[OS-TEST-GAP]` | MUST FIX / RECOMMEND | A specified scenario has no asserting test. MUST FIX on critical paths (auth, money, core domain). |
| `[OS-STD-VIOLATION]` | RECOMMEND | Coding-standards or convention breach (typing, naming, exports, hardcoded strings, i18n). |
| `[OS-PERF]` | RECOMMEND | Measurable or likely performance regression. |
| `[OS-DOC-DRIFT]` | RECOMMEND | README / Swagger / JSDoc no longer matches shipped behavior. |
| `[OS-DESIGN-DEBT]` | RECOMMEND | Duplication, leaky abstraction, or DRY/SOLID erosion with no spec impact. |
| `[OS-PRAISE]` | PRAISE | Notably good spec fidelity, test design, or abstraction worth reinforcing. |

---

## 5. Output Format

````markdown
# Code Review & Spec Verification

**Change:** <change-name>  **Schema:** <schema-name>
**Diff base:** <base-ref>...HEAD (<N> files, +<A>/-<D>)
**Artifacts read:** proposal.md, design.md, tasks.md, specs/<capability>/spec.md
**Standards source:** <CODING_STANDARDS.md | .windsurfrules | ...>

## Verdict

> **<APPROVED | APPROVED WITH RECOMMENDATIONS | CHANGES REQUESTED>**
> <one-sentence justification>

| Metric | Result |
| --- | --- |
| Requirements covered | 6 / 7 |
| Scenarios covered | 21 / 24 |
| Scope violations | 1 |
| Must fix / Recommend | 3 / 4 |

## Requirement Coverage

| Delta | Requirement | Scenarios | Implementation | Status |
| --- | --- | --- | --- | --- |
| ADDED | Protected dashboard access | 4/4 | `backend/src/dashboard/dashboard.controller.ts:18` | ✅ Met |
| ADDED | Consistent aggregate snapshot | 2/3 | `backend/src/dashboard/dashboard.service.ts:44` | ⚠️ Partial |
| MODIFIED | Session refresh | 0/2 | — | ❌ Missing |

## 1. MUST FIX (blocking)

### 1.1 `[OS-SPEC-MISMATCH]` Utilization is not undefined when the limit is absent
- **File:** <ref_file>backend/src/dashboard/dashboard.service.ts:57</ref_file>
- **Spec:** `specs/dashboard-overview/spec.md` → *Scenario: Credit limit is not declared*
- **Expected:** limit, available credit and utilization remain `undefined`.
- **Actual:** the limit is coerced to `0`, producing `Infinity` in the ratio.
- **Fix:** guard on `limit == null` and propagate `undefined` instead of defaulting to `0`.

### 1.2 `[OS-SCOPE-CREEP]` Card creation endpoint was not authorized
- **File:** <ref_file>backend/src/cards/cards.controller.ts:31</ref_file>
- **Proposal:** *"Add card / Create reminder buttons are positioned but carry no behavior, form, CRUD or write API in this change."*
- **Impact:** ships an unreviewed, unspecified write path.
- **Fix:** revert from this change, or raise a new proposal covering card creation.

## 2. RECOMMENDATIONS (non-blocking)

### 2.1 `[OS-PERF]` Reminder query is unbounded
- **File:** <ref_file>backend/src/dashboard/dashboard.service.ts:88</ref_file>
- Add a `take` limit; the spec only requires *upcoming* reminders.

## 3. PRAISE

- `[OS-PRAISE]` Per-user isolation is derived purely from the JWT subject in `dashboard.service.ts`, matching the isolation scenario exactly — no client-supplied id is trusted anywhere.
- `[OS-PRAISE]` `SummaryCard` cleanly removes the duplication the design flagged as a risk.

## 4. Task Ledger

| Task | Claimed | Verified | Note |
| --- | --- | --- | --- |
| 3. Aggregate service | `[x]` | ⚠️ | Blocked by finding 1.1 |

## 5. Next Actions

1. Resolve findings 1.1–1.2.
2. Re-run `openspec validate <change> --strict` and the affected test suites.
3. Re-request review; only then proceed to `/openspec-archive-change`.
````

---

## 6. Guardrails

- **Never edit implementation code in this skill.** Report, then let the user decide.
- **Never edit the spec to match the code.** If the spec is genuinely wrong, say so and recommend `/openspec-update-change`.
- **Never approve unverified work.** If you could not locate the implementation of a requirement, its status is `❌ Missing`, not "probably fine".
- **Scope creep is blocking, even when the extra code is good.** Unspecified behavior is unreviewed behavior.
- **A `- [x]` checkbox is a claim, not evidence.** Verify it against code and tests.
- **Cite, don't summarize.** Every finding needs a file reference and a spec/proposal quote.
- **Read whole files, not just diff hunks**, before asserting that something is missing.
- **Distinguish pre-existing issues from issues introduced by this change**, and label them as such.
- **Respect `openspec/config.yaml`:** committed artifacts are English; the conversational summary to the user follows the configured communication language.
- **Do not copy runtime `context` or `operationGuidance` verbatim** into the report or into any artifact.
- If a rule in `config.yaml` conflicts with a controlling spec clause, report the conflict rather than silently choosing one.

## 7. Fluid Workflow Integration

- Can be invoked at any point: mid-implementation (partial review), before commit, before PR, or as a gate before `/openspec-archive-change`.
- Reviewing a partially implemented change is valid — mark unstarted tasks as `⏳ Not started` rather than `❌ Missing`.
- On `CHANGES REQUESTED`, hand off to `/openspec-apply-change` for fixes; on spec defects, hand off to `/openspec-update-change`.
- Findings that survive review and are accepted should be recorded in the change's `verification.md`.
