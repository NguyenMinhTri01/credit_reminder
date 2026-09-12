# Review Adjudication & OpenSpec Remediation Plan

`review-adjudication` independently evaluates another review and produces a decision report with
an implementation plan. It checks technical claims, necessity, feature impact, OpenSpec scope,
and the cost of the suggested remedy. It does not apply fixes.

The canonical workflow is in [SKILL.md](SKILL.md). The output structure is in
[references/report-template.md](references/report-template.md).

## Usage

```text
Use review-adjudication to evaluate docs/review.md for OpenSpec change <change-name>.
Independently verify every finding, including whether it is necessary, outside scope, or
over-engineered. Write a report and remediation plan for me to review and share with another agent.
```

The review can also be pasted into the request. Supply the change name and reviewed/base revisions
when known; missing evidence is reported instead of guessed.

## Output

- For active changes: `<changeRoot>/review-adjudication-plan.md`.
- For archived work or no matching active change:
  `docs/reviews/<change-or-review-slug>-adjudication-plan.md`.
- Repository reports are English under `openspec/config.yaml`; the conversational summary is
  Vietnamese, unless the user explicitly overrides the language.
- Each finding has a decision, evidence, feature impact, necessity/scope reasoning, and an explanation
  of why it does or does not need fixing. Unverified claims use `NEEDS_EVIDENCE`.
- Accepted findings have bounded remedies, requirement/scenario/task references, acceptance criteria,
  and unchecked tasks with completion checks. `ACCEPTED_FIX` is a recommendation, not approval.

The report is supplementary documentation, not an OpenSpec schema artifact or a replacement for
`tasks.md`. After reviewing it, the user can instruct any agent:

```text
Implement ACCEPTED_FIX items RA-001 and RA-003 from <report-path>. Revalidate their evidence,
map the approved work into the active OpenSpec artifacts/tasks, and follow the report's scope,
acceptance criteria, and verification plan. Leave all other findings outside the implementation.
```

The receiving agent follows the available OpenSpec planning/apply workflows. Archived work needs
a new active change; existing archive files stay historical. Run `pnpm skills:check` after editing
this shared skill; no manually maintained tool-specific copies are needed.
