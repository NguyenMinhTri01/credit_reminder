## Context

The credit-card-management change is already archived. Its implementation now includes post-review
hardening for atomic balances, validation, pagination, UI failure handling, and sidebar hydration,
but the repository documentation does not describe the delivered feature set consistently. See
`proposal.md` for the motivation and intended scope.

The existing migration preserves `NULL` for `available_credit` when a legacy card has no credit
limit. That is the implemented compatibility behavior. An archived design still describes a
different fallback, so the forward-looking documentation must state the implemented behavior
without rewriting archival history.

## Goals / Non-Goals

**Goals:**

- Make repository, backend, and frontend documentation match the current product structure and
  public API surface.
- Publish a durable post-review record that explains the migration compatibility decision, the
  follow-up remediation scope, and reproducible validation commands.
- Preserve OpenSpec archival history while making the current documentation unambiguous.

**Non-Goals:**

- Change application behavior, API payloads, Prisma schema, migrations, dependencies, or tests.
- Rewrite archived proposals, designs, specs, or task history.
- Create a corrective data migration for databases where the historical migration may already have
  run; that requires a separate deployment decision.

## Decisions

### D1: Keep archived OpenSpec artifacts immutable and add a forward-looking remediation record

Create `docs/credit-card-management-post-review.md` as the canonical repository note for the
post-review findings. It will identify the implemented nullable migration behavior, explain that
the original archived plan is historical, and link readers to the migration and current OpenSpec
specifications.

**Rationale:** Editing archives weakens historical traceability. A separate record preserves what
was planned while documenting the decision that governs future maintenance.

**Alternative considered:** Amend the archived proposal and design. Rejected because it makes the
original approved plan indistinguishable from a later correction.

### D2: Document APIs at two levels

`backend/README.md` will provide a concise endpoint inventory for credit cards and nested
transactions. Swagger remains the canonical source for request/response schemas and examples.

**Rationale:** The README supports discovery without duplicating every DTO detail maintained by
Swagger decorators.

**Alternative considered:** Put complete request and response schemas in the README. Rejected
because it would duplicate Swagger and drift more quickly.

### D3: Treat package manifests and source layout as the documentation source of truth

The root README will reflect the installed Next.js major version and local shared-code layout.
The frontend README will document the authenticated cards route, feature components, related
hooks, and static bank assets. The backend README will include the two feature modules in its
project tree.

**Rationale:** These facts are directly verifiable from `frontend/package.json` and the repository
layout, reducing ambiguity for contributors.

**Alternative considered:** Leave READMEs high-level and rely entirely on source discovery.
Rejected because the project rules require README updates when structure changes.

### D4: Use lifecycle-aware OpenSpec validation commands

The remediation record will distinguish active-change validation from archive validation. Archived
changes are validated with `openspec validate --archived --strict`; current specifications are
validated with `openspec validate --specs --strict`.

**Rationale:** A named archived change is not available to `openspec validate <change>`, so the
record must provide commands that remain executable after archival.

### D5: Remove the unsupported verification rule from the local OpenSpec configuration

Remove `rules.verification` from `openspec/config.yaml`. The current `spec-driven` schema exposes
only proposal, specs, design, and tasks, so the rule causes every `openspec instructions` call to
emit an unsupported-artifact warning.

**Rationale:** Removing a rule for an artifact that does not exist restores a warning-free planning
workflow without changing the selected schema or any committed artifact requirements.

**Alternative considered:** Add a custom verification artifact. Rejected because the project has
no schema support or lifecycle requirement for it; validation evidence belongs in tasks and the
post-review record.

## Risks / Trade-offs

- **[Risk] Documentation can drift after future API changes** → Keep endpoint names concise in the
  README and direct schema-level questions to Swagger.
- **[Risk] A production database may have run an older migration definition** → State that the
  documentation does not alter deployed data and require a separately planned corrective migration
  if an environment needs data repair.
- **[Trade-off] The archive remains internally inconsistent** → The remediation record makes the
  current operational decision explicit without mutating historical evidence.
- **[Risk] Removing the rule could hide a future verification-artifact workflow** → Reintroduce it
  only together with a schema that defines and validates that artifact.

## Migration Plan

1. Remove the invalid OpenSpec rule, add the remediation record, and update the three READMEs in
   one documentation-only change.
2. Check paths, endpoint names, runtime versions, and validation commands against the repository.
3. Run `openspec validate fix-post-review-credit-card-management --strict`,
   `openspec validate --archived --strict`, and `openspec validate --specs --strict`.
4. Deploy normally; no runtime migration, rollback, or data operation is required. Revert the
   documentation commit if its content needs correction.
