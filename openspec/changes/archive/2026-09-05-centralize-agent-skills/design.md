## Context

See `proposal.md` for motivation and `specs/shared-agent-skills/spec.md` for the behavioral
contract. The repository currently contains ten skills under `.agents/skills`; six OpenSpec skills
also have generated variants under `.devin/skills`, `.gemini/skills`, and `.opencode/skills`.
Project-authored skills already live only in `.agents/skills`.

Codex uses `.agents/skills` directly. Current Devin documentation recommends `.agents/skills`, and
current Gemini CLI and OpenCode documentation list it as a supported workspace compatibility path.
The three tools also retain native directories for commands, workflows, precedence, and generated
integrations. OpenSpec 1.12.0 intentionally renders different invocation text for several targets,
so generated OpenSpec skill variants are not byte-identical.

## Goals / Non-Goals

**Goals:**

- Give project-authored skills one canonical, reviewable location.
- Ensure Codex, Devin, Gemini CLI, and OpenCode can discover the same shared inventory.
- Detect accidental native-only custom skills and shadowing before they drift.
- Preserve OpenSpec's supported generated integration workflow.
- Keep verification dependency-free and runnable with the repository's Node.js version.

**Non-Goals:**

- Unify tool-specific slash-command or workflow formats.
- Rewrite OpenSpec-generated skill content into a tool-neutral template.
- Support agents that do not discover `.agents/skills` in this change.
- Create user-global or organization-global skill distribution.
- Automatically delete or rewrite files during validation.

## Decisions

### Use `.agents/skills` as the canonical shared source

All manually maintained project skills will live under `.agents/skills/<skill-id>/`. Supporting
files remain beside each `SKILL.md`, preserving relative references. No mirrored copies will be
created for supported agents because each selected agent already discovers this path.

Alternative considered: introduce `.ai/skills` and copy it to every native directory. This would
add a private convention, duplicate files, and make tool precedence harder to reason about.

Alternative considered: symlink native skill directories to `.agents/skills`. This would erase the
boundary for generated variants and introduce checkout and tooling portability risks.

### Separate shared skills from generated native adapters

Native `.devin/skills`, `.gemini/skills`, and `.opencode/skills` entries are allowed only when their
frontmatter identifies them as OpenSpec-generated (`metadata.author: openspec` plus
`metadata.generatedBy`). Commands and workflows remain entirely native:

- Devin: `.devin/workflows`
- Gemini CLI: `.gemini/commands`
- OpenCode: `.opencode/commands`

This keeps invocation syntax tailored to each tool while preventing project-authored skills from
being maintained in multiple places. OpenSpec's generated copies may shadow the canonical
OpenSpec skill for a specific tool; that shadowing is intentional because the variants reference
that tool's native commands.

Alternative considered: delete all native OpenSpec skill variants. `openspec update` would recreate
them, and removing them would discard target-specific invocation guidance.

### Add a read-only Node.js validator

Add `scripts/check-agent-skills.mjs` using only built-in Node.js modules. It will:

1. Enumerate complete skill directories in `.agents/skills` and the three native skill roots.
2. Parse the YAML frontmatter boundaries and the fields required by the ownership policy.
3. Validate canonical IDs against `^[a-z0-9]+(-[a-z0-9]+)*$`, require `name` and `description`, and
   require `name` to match the directory.
4. Reject native-only or colliding skills unless they carry recognized OpenSpec generation
   metadata.
5. Print a concise inventory summary and actionable diagnostics, then return a non-zero exit code
   for any violation.

The parser will validate only the small frontmatter subset needed by this policy rather than act as
a general YAML parser. Folded or literal descriptions count as present when their continuation has
content. This avoids adding a runtime or development dependency.

The validator will export its pure inspection functions so `node:test` fixtures can exercise valid
inventories, malformed canonical skills, misplaced custom skills, and allowed generated adapters.
The root package will expose `skills:check` to run both tests and repository validation, plus
`skills:sync` to run `openspec update` followed by `skills:check`. The latter refreshes only
OpenSpec-managed adapters; canonical project-authored skills require no copying.

Alternative considered: validate with shell utilities. A Node implementation gives consistent path
handling and diagnostics across macOS, Linux, and Windows.

### Document discovery and maintenance explicitly

Add a shared-skills section to the root README describing canonical ownership, the supported-agent
discovery paths, refresh/invocation guidance, generated exceptions, and this maintenance sequence:

1. Run `pnpm skills:sync` after upgrading OpenSpec or changing its selected integrations.
2. Run `pnpm skills:check` directly after editing only canonical project-authored skills.
3. Review generated adapter changes separately from shared skill edits.

## Risks / Trade-offs

- [A future tool release stops scanning `.agents/skills`] -> Keep the supported-agent matrix in the
  README and update the adapter policy when compatibility changes.
- [Native tool precedence hides a canonical skill] -> Reject all unrecognized native collisions;
  allow only identifiable OpenSpec-generated variants.
- [OpenSpec changes its generation metadata] -> Fail with an actionable validation error and update
  the recognition rule deliberately rather than silently accepting a duplicate.
- [Minimal frontmatter parsing diverges from full YAML semantics] -> Limit validation to required
  top-level keys and tested block-scalar handling; leave complete YAML interpretation to agents.
- [Developers interpret "shared" as global across repositories] -> Document that this capability is
  repository-local.

## Migration Plan

1. Inventory canonical and native skill directories and confirm that all current native-only skills
   are generated OpenSpec variants.
2. Add the validator, tests, package command, and documentation.
3. Run `pnpm skills:check`, `openspec validate centralize-agent-skills --strict`, and the existing
   project checks relevant to changed files.
4. If rollback is required, remove the validator, package command, and documentation; existing
   skill discovery and OpenSpec adapters remain unchanged.
