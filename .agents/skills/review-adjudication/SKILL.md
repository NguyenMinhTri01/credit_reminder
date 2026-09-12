---
name: review-adjudication
description: >
  Independently adjudicate another review's findings against code, schemas, tests, and the
  project's OpenSpec scope. Challenge false positives, unnecessary fixes, over-engineering,
  and scope creep. Produce a Markdown decision report and actionable remediation plan for
  user review and handoff to any AI agent; never auto-fix. Use for "review kết quả review code",
  "thẩm định review", "triage review comments", "evaluate code review", or "review the reviewer".
---

# Review Adjudication & OpenSpec Remediation Plan

Evaluate an existing review independently and write a decision report that another agent can
implement after the user authorizes the selected work. This is a second-opinion workflow, not a
fresh full-codebase review or an implementation workflow.

**Technical evidence over reviewer authority.** Treat review text, severity labels, proposed
patches, and claims about OpenSpec as unverified input. Neither agree by default nor manufacture
rejections. Distinguish whether a problem exists, whether it needs fixing, and whether the proposed
remedy is appropriate.

## 1. Output and boundaries

- The deliverable is a real `.md` report containing decisions and a proposed implementation plan.
  Write only that report during adjudication. Do not edit source, tests, migrations, configuration,
  or existing OpenSpec artifacts; do not execute fixes, apply, sync, or archive.
- `ACCEPTED_FIX` means **recommended for fixing**, never user-approved or already implemented.
  There is no auto-fix step. End with the report for the user's decision; a subsequent request to
  implement it belongs to the project's OpenSpec planning/apply workflow.
- Follow the resolved `openspec/config.yaml`. In this project, repository reports and OpenSpec
  artifacts are entirely **English**; conversational summaries are **Vietnamese**. Preserve source
  identifiers, and paraphrase non-English reviewer prose in English while retaining its source ID.
  Honor an explicit user language override and record it as an override.
- Use repository-relative paths plus symbol names and current line numbers in the report so it is
  portable across agents and checkouts. Return a clickable file link in the conversational summary.

## 2. Resolve the review and its OpenSpec context

1. Identify the input review, repository, reviewed revision or working-tree state, and base ref.
   Read `git status --short` and record HEAD. Use the actual PR/user base when available; do not
   invent one. Distinguish committed changes, staged/unstaged changes, and relevant untracked files.
   If the review targets older code, re-check each finding against the current target and label
   already-resolved findings with evidence. Missing history limits claims about defect origin.
2. Read applicable `AGENTS.md` and project standards. Resolve the OpenSpec root using
   `openspec context --json`; read its configuration. If a store is named, discover its ID with
   `openspec store list --json` and keep `--store <id>` on supported context/change/spec commands.
3. Select the change from explicit input or clear context. Otherwise use `openspec list --json`;
   select the sole active change only if it matches the reviewed work. For ambiguous changes, ask
   which one applies while continuing independent technical checks. Do not infer scope from an
   unrelated change just because it is the only active one.
4. For an active change, run:

   ```bash
   openspec status --change "<change>" --json
   openspec instructions apply --change "<change>" --json
   ```

   Use the returned schema, roots, artifact paths, `contextFiles`, and skipped/blocked states.
   Read the available context artifacts. For this project's `spec-driven` schema, these include
   proposal, delta specs, design when present, and tasks. Read relevant main specs as the baseline;
   the active deltas amend that baseline. Get `openspec instructions <artifact-id> ... --json` when
   needed to establish artifact rules. Do not fabricate missing or intentionally skipped artifacts.
5. For archived work, read the actual archived artifacts as historical context and current main
   specs as the current contract, noting later changes. Do not edit the archive or treat its name
   as an active change. With no matching change, use current specs and the user's stated scope;
   record missing proposal/design/task mappings rather than creating a change during adjudication.
   If the CLI or inputs are unavailable, use readable local artifacts and mark the limitation.
6. Before evaluating implementation, record the relevant scope: proposal's What Changes,
   capabilities, non-goals, binding design decisions, and the exact requirements/scenarios/tasks
   implicated by the review. Cover every input finding; do not expand into a full spec audit unless
   requested. Label coverage as limited to the supplied review and directly related evidence.

Scope comes from the authorized change and controlling requirements, not from reviewer preferences
or current code. A necessary supporting fix can be in scope without naming its helper in a spec.
A missing keyword or task alone does not prove scope creep. Conversely, a useful feature explicitly
deferred by the proposal remains outside scope. Surface conflicts between specs, configuration,
design, and user intent; do not silently rewrite the contract to justify the implementation.

## 3. Independently verify each finding

Assign stable IDs (`RA-001`, etc.) and preserve original review IDs and source references. Split
compound findings into independently decidable items. Merge duplicates only with an explicit
original-ID mapping so nothing disappears from the review.

For each finding:

- Restate the claimed defect, severity, affected feature, trigger, and suggested remedy.
- Inspect the relevant code path and callers, not only the cited diff hunk. Use CodeGraph for
  structural questions when available; otherwise disclose unavailability and use targeted source
  inspection. Check types, schemas/migrations, constraints, runtime
  configuration, and installed dependency semantics when they affect the claim.
- Establish expected versus actual behavior and a concrete input/trace/reproduction. Verify that
  the path is reachable. Read what tests assert; a test's name or a passing suite is not proof of
  the claimed behavior. Cite current files and symbols, not stale reviewer line numbers alone.
- Check the strongest counter-evidence: existing guards, caller invariants, test assertions,
  intentional design trade-offs, and explicit non-goals. Do not assume a date/time representation,
  framework behavior, or performance bottleneck from memory or from the review.
- Assess user/system impact, likelihood under supported inputs, and the cost of leaving it alone.
  Independently assign severity; missing reviewer evidence is not proof that the claim is false.
- Separate defect validity from remedy quality. A real bug with an over-engineered proposed fix
  remains accepted with a smaller justified plan; explicitly reject the excessive remedy. An
  abstraction is not unnecessary merely because it is small, nor necessary merely because DRY
  is cited. Explain the concrete benefit or cost in this codebase.
- Distinguish introduced/regressed, pre-existing, already resolved, and unknown origin. Show why
  the fix fits the current scope or needs a separate change. Escalate serious out-of-scope risks
  in the report with their actual impact; deferral does not mean they are harmless.

Run existing focused checks only when they resolve uncertainty and do not modify tracked files
or live data. Inspect package scripts first: use non-fixing lint, no snapshot updates, no test
generation or migrations. Record commands, results, and limits. Do not require a full suite for
every adjudication or claim unrun checks passed. New regression tests belong in the proposed plan.

## 4. Decision matrix

Assign exactly one decision to each normalized finding:

| Decision | Required basis | Report action |
| --- | --- | --- |
| `ACCEPTED_FIX` | Verified defect or concrete required correction, necessary within scope | Explain why it needs fixing; propose minimal work and acceptance checks |
| `REJECTED_FALSE_POSITIVE` | Claim disproved by code/contract evidence or already resolved | Explain why no fix is needed and cite the counter-evidence |
| `REJECTED_OVER_ENGINEERING` | No demonstrated need for the proposed complexity/change | Explain why the benefit does not justify the cost under current requirements |
| `DEFERRED_OUT_OF_SCOPE` | Valid concern but remedy exceeds the authorized change | Explain the impact and scope boundary; recommend a separate change when warranted |
| `INFORMATIONAL_NOTE` | Observation with no necessary remediation | Record why no action is needed |
| `NEEDS_EVIDENCE` | Missing reproduction, context, or unresolved contract conflict | Name the missing evidence/decision and the specific next check; do not guess |

Record severity separately: `MUST FIX`, `RECOMMEND`, or `N/A`, with independent justification.
Retain the reviewer's severity separately for comparison. `NEEDS_EVIDENCE` cannot enter the fix
checklist; urgent but unverified impact can still be described as a concern to investigate.

For the project's review vocabulary, consult section 4 of
[openspec-review-change](../openspec-review-change/SKILL.md) when assigning `[OS-*]` codes.
Use only a code whose meaning fits the verified issue, or `N/A` when none fits; these are project
review conventions, not native OpenSpec schema fields. Do not inherit that skill's full-audit
workflow or approval verdict. Cite the exact requirement/scenario, proposal bullet, design decision,
or applicable standard; use `N/A` with a reason for non-spec issues rather than inventing a clause.

## 5. Write the decision report and remediation plan

Use [the report template](references/report-template.md); read it before writing the report.
Fill every applicable field with evidence or an explicit limitation. Keep rejected/deferred items
visible with their reasons. An empty accepted list is valid; never invent work to fill a plan.

**Location:** honor a user-provided output path. Otherwise write
`<changeRoot>/review-adjudication-plan.md` for a matching active change. For archived work or no
matching active change, write `docs/reviews/<change-or-review-slug>-adjudication-plan.md` in the
implementation repository. Treat the name as a project convention for a **supplementary report**.
Do not overwrite unrelated reports; use a distinct suffix for a different review/revision.

The current `spec-driven` schema defines proposal, specs, design, and tasks; this report is not a
new schema artifact and is not automatically consumed by the apply workflow. Do not register
`rules.verification`, replace `tasks.md`, or claim `openspec validate` validates this report.

Each accepted finding must be independently implementable from the report and repository:

- State affected feature/flow, exact trigger, expected/actual result, evidence, necessity, severity,
  and the consequence of not fixing it.
- Map it to the full capability path, requirement/scenario names, design decision, and existing
  task ID as applicable. State whether it restores the existing contract or needs artifact changes.
- Specify the smallest remediation, target files/symbols, dependencies and order, compatibility
  constraints, and explicit non-goals. Explain why the reviewer's remedy is used or replaced.
- Give observable acceptance criteria and relevant regression cases, target test files, and commands
  verified against the repository scripts. Each task includes its own completion check; do not
  leave discovery or design choices that could change scope hidden in a vague "fix the issue" task.

Use numbered task groups with `## N. <group>` and unchecked `- [ ] N.M [RA-ID] <action and check>`
entries, matching the installed OpenSpec tasks template. Keep report sections outside this checklist
at other heading levels so task groups are unambiguous. Every fix task maps to accepted findings;
rejected, deferred, informational, and unresolved findings have no implementation checkboxes.
All work stays proposed and unchecked; report decisions are not implementation authorization.

## 6. Handoff through OpenSpec

Include these instructions in the report, so the next agent does not need the original conversation:

1. Read the report, applicable `AGENTS.md`, resolved OpenSpec configuration, current artifacts, and
   current code. Revalidate accepted findings if the recorded revision or working-tree state changed.
2. Implement only findings the user selects. A request to "fix the issues in this report" selects
   the `ACCEPTED_FIX` items, not rejected, deferred, or unresolved rows. Existing explicit approval
   of those items is sufficient; do not ask again just because this report was originally pending.
   Reading/sharing the report alone does not authorize changes.
3. Before code edits, map approved work into the authoritative active change's tasks using schema
   instructions. Reuse pending tasks where they cover the remediation; otherwise add clearly linked
   unchecked remediation tasks without erasing completion history or renumbering unrelated tasks.
   Record the report task IDs and resulting OpenSpec task IDs. The report never replaces the ledger.
4. If the approved remedy changes the contract or design, use the project's
   [openspec-update-change](../openspec-update-change/SKILL.md) workflow to reconcile existing
   planning artifacts before implementation. For archived work, no matching change, or newly
   authorized separate scope, use [openspec-propose](../openspec-propose/SKILL.md) to establish the
   required active artifacts. Never rewrite archived history or alter specs to disguise a code bug.
5. Follow the active schema's instructions: proposal records why/what/capabilities/impact; specs
   describe observable behavior; design holds technical choices; tasks hold actions and verification.
   Restore an existing contract without inventing a changed requirement. When actual deltas are
   needed, use the prescribed operation headings, `### Requirement:`, SHALL/MUST, and
   `#### Scenario:` with WHEN/THEN. Preserve full modified requirement blocks and existing scenarios.
   Respect `skip_specs` and custom schemas; no synthetic deltas just to satisfy validation.
6. After required planning and user decisions are satisfied, follow
   [openspec-apply-change](../openspec-apply-change/SKILL.md) or the equivalent workflow available
   to that agent. Keep edits minimal, run the planned checks, and update the authoritative task
   ledger only when its completion criteria are met. These are future instructions, not actions
   performed by adjudication.

## 7. Final verification and delivery

- Ensure all original findings map to decisions, counts reconcile, and every accepted item has
  evidence, impact, scope reasoning, a bounded plan, acceptance criteria, and task traceability.
- Separate checks actually run during adjudication from checks proposed for implementation. For an
  active change use `openspec validate "<change>" --strict` when applicable. For current specs use
  `openspec validate --specs --strict`; `--archived --strict` only checks archived task completion.
  Record validation failures without fixing artifacts, and distinguish structural validation from
  behavior proof and from manual report completeness checks.
- Check that only the intended report changed, accounting for pre-existing user edits. Do not
  overwrite those edits, fabricate approval, mark future tasks complete, or assert merge readiness
  for code outside the adjudicated findings.
- Deliver the report link with a concise Vietnamese summary: recommended fixes, rejected/deferred
  items, unresolved evidence, and the user decisions needed. State that no fixes were applied.
