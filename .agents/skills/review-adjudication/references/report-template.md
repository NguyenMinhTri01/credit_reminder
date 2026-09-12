# Report template

Use the structure below for the generated report. Replace placeholders; use `N/A — <reason>` for
inapplicable fields. Keep sections for all decisions, including an explicit `None` when empty.
Repeat finding records as needed. Use English under the project's artifact policy unless the user
explicitly requests another language. Preserve portable repository paths and exact source IDs.

Task groups use OpenSpec's numbered level-two headings and `- [ ] N.M` syntax. All other report
sections use level-three headings. The final report is supplementary planning documentation;
it is not a schema-defined artifact, does not approve fixes, and is not an apply task ledger.

```markdown
# Review Adjudication and Remediation Plan

- Report status: PROPOSED — no fixes applied
- User implementation decision: PENDING / <explicit selected IDs and request reference>
- Adjudication coverage: COMPLETE / PARTIAL — limited to the supplied findings
- Review source: <path/URL or supplied review label; date; original IDs>
- Repository / branch: <identity>
- Reviewed revision / current HEAD: <hashes or unavailable with reason>
- Diff base and working-tree scope: <actual ref/hash, dirty paths, relevant untracked paths>
- OpenSpec root / store: <resolved root identity; local or store ID>
- Change / lifecycle / schema: <name; active/archived/unlinked; schema>
- Artifacts and standards read: <paths; missing/skipped artifacts and reason>
- Language policy: <resolved configuration; explicit override if any>

### Decision summary

<Short independent conclusion about which concerns merit action and why. This is not a full
implementation review or a merge-approval verdict.>

| ID | Original IDs | Claim | Affected feature | Decision | Severity | Why / next action |
| --- | --- | --- | --- | --- | --- | --- |
| RA-001 | <source IDs> | <claim> | <flow> | ACCEPTED_FIX | MUST FIX | <reason> |

- Input findings: <count>; normalized findings: <count>; duplicate/split mapping: <details>
- ACCEPTED_FIX: <count>
- REJECTED_FALSE_POSITIVE: <count>
- REJECTED_OVER_ENGINEERING: <count>
- DEFERRED_OUT_OF_SCOPE: <count>
- INFORMATIONAL_NOTE: <count>
- NEEDS_EVIDENCE: <count>

### OpenSpec scope and traceability

- In scope: <proposal bullets, capabilities, required supporting work>
- Out of scope: <explicit non-goals, deferred features>
- Binding decisions and contract conflicts: <design refs; conflicts or None>

| Finding | Capability / spec path | Requirement → scenario | Proposal / design basis | Existing task | Contract effect |
| --- | --- | --- | --- | --- | --- |
| RA-001 | <full path> | <exact names> | <path and clause> | <ID or N/A with reason> | Restores existing contract / proposed artifact change / unresolved |

### Accepted findings — recommended for fixing

#### RA-001 — <precise issue title>

- Decision: ACCEPTED_FIX
- Original finding: <source ID, reference, reviewer claim and remedy>
- Reviewer severity / adjudicated severity: <values; independent rationale>
- Project finding code: <verified OS-* code or N/A with reason>
- Affected feature and impact: <user flow, API/data behavior, affected users or systems>
- Origin: <introduced/regressed/pre-existing/unknown; evidence; reviewed revision>
- Trigger / reproduction: <concrete conditions, inputs, execution path>
- Expected behavior: <contract and observable result>
- Actual behavior: <observed result and failure mechanism>
- Evidence: <repo-relative path:line + symbol; schema/type/test/command evidence>
- Counter-evidence considered: <guards, tests, design decisions; why insufficient>
- Why fixing is necessary: <consequence and realistic conditions if left unchanged>
- Scope basis: <why this remediation belongs to the authorized change>
- Reviewer remedy assessment: <accept or replace; explain any unnecessary complexity>
- Minimal remediation: <specific actions and target files/symbols; bounded outcome>
- Compatibility and non-goals: <behavior to preserve; unrelated changes excluded>
- Dependencies / order: <RA IDs or None; resolve blocking questions before tasking>
- OpenSpec integration: <existing task mapping; proposed task/artifact edits and why;
  no requirement changes if this only restores the contract>
- Acceptance criteria:
  - WHEN <concrete condition>, THEN <observable expected result>.
  - WHEN <relevant boundary/regression condition>, THEN <preserved behavior>.
- Regression verification: <test file/case and meaningful assertion; verified command>
- Plan task IDs: <N.M entries below>

### Findings not scheduled for fixing

#### <RA-ID> — <title>

- Decision: <REJECTED_FALSE_POSITIVE / REJECTED_OVER_ENGINEERING /
  DEFERRED_OUT_OF_SCOPE / INFORMATIONAL_NOTE>
- Original finding: <source ID; claim; suggested remedy; reviewer severity>
- Adjudicated severity / project code: <value and rationale; code or N/A>
- Affected feature and actual behavior: <flow; impact or lack of demonstrated impact>
- Evidence and contract basis: <code/schema/tests and exact OpenSpec/standard refs>
- Independent reasoning: <why the claim is false, fix is unnecessary, complexity is unjustified,
  or valid concern falls outside the proposal; evaluate the strongest opposing evidence>
- Consequence of leaving unchanged: <actual residual risk or why behavior is correct>
- Disposition: <no change / already resolved / possible separate change with rationale>
- Reconsider only if: <specific changed requirement or new evidence, if applicable>

### Unresolved findings and decisions

| ID | Claim / affected feature | Evidence checked | Missing evidence or conflict | Specific next check / user decision | Implementation impact |
| --- | --- | --- | --- | --- | --- |
| <RA-ID> | <claim> | <refs> | <unknown> | <concrete action> | <which conclusion/work remains blocked> |

<Use NEEDS_EVIDENCE for these findings. Do not hide uncertainty in accepted tasks.>

### Proposed implementation checklist

Only ACCEPTED_FIX findings are eligible. All entries remain unchecked until authorized work is
implemented and verified through the authoritative OpenSpec task ledger. If none were accepted,
write "No implementation tasks proposed" and omit the numbered groups.

## 1. <Accepted remediation group>

- [ ] 1.1 [RA-001] <Specific change at path/symbol>; verify <observable criterion or test command>.
- [ ] 1.2 [RA-001] <Relevant regression coverage at test path>; verify <assertions and command>.

## 2. <Dependent remediation or cross-cutting verification, only if needed>

- [ ] 2.1 [RA-001, RA-002] <Action after tasks N.M>; verify <concrete completion criterion>.

### Verification evidence and future checks

| Check | Phase | Command / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- | --- |
| <targeted check> | Adjudication | <actual command or files examined> | PASS / FAIL / NOT RUN | <output summary or reason> |
| <regression test> | Future implementation | <verified project command> | NOT RUN | <expected assertion> |
| OpenSpec structure | <phase> | <lifecycle-appropriate validate command> | <actual status> | Validates artifacts, not this report or runtime correctness |

### Handoff instructions for the implementing agent

1. Read this report, current code, applicable AGENTS.md, and resolved OpenSpec configuration and
   artifacts. Revalidate findings if the recorded revision or working-tree state has changed.
2. Follow the user's selected ACCEPTED_FIX IDs. "Fix the issues in this report" means accepted
   findings only. Rejected, deferred, informational, and NEEDS_EVIDENCE items are excluded.
   Reuse existing explicit approval; merely receiving this report is not approval to implement.
3. <Concrete path for this case: reuse the active change and named tasks; reconcile specified
   artifacts via openspec-update-change; or establish a new active change via openspec-propose.
   Include actual paths, task mappings, and required artifact edits. Never rewrite archived history.>
4. Transfer approved checklist items into the authoritative tasks artifact with report-ID mapping,
   using the schema's instructions and keeping completion history. This report does not replace
   proposal/specs/design/tasks and is not automatically consumed by the apply workflow.
5. Use openspec-apply-change or the agent's equivalent available workflow once required planning
   and user decisions are satisfied. Implement the minimal remedies and meaningful regression checks.
6. Run the specified verification, record actual results, and mark authoritative tasks complete only
   when their acceptance criteria pass. Report remaining failures; do not expand scope to fix others.

### Decisions requested from the user

- <Accept all recommended fixes or select particular RA IDs; distinguish MUST FIX/RECOMMEND>
- <Only material scope/contract questions or evidence needed; None if absent>
- No code or existing OpenSpec artifact changes were made during this adjudication.
```
