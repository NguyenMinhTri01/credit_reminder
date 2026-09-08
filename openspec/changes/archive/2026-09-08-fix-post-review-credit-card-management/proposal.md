## Why

The post-review audit found documentation drift around the credit-card-management delivery: the
archived migration plan conflicts with the deployed nullable-data behavior, project READMEs omit
the delivered cards and transactions features, and follow-up fixes made after archival are not
traceable through an active OpenSpec change. These gaps make maintenance and safe deployment less
reliable even though the implementation and OpenSpec artifacts validate structurally.

## What Changes

- Document the nullable `available_credit` migration behavior and the single combined migration
  without rewriting archived historical artifacts.
- Update root, backend, and frontend READMEs to reflect the current Next.js version, local shared
  code layout, cards route, credit-card and transaction modules, API endpoints, hooks, and bank
  assets.
- Record the post-review remediation scope and validation evidence so the atomic balance,
  validation, pagination, UI error-state, and sidebar hydration fixes are traceable after the
  original change was archived.
- Replace archive-inapplicable validation guidance with commands that can be run against archived
  changes and current specs.
- Remove the stale `verification` artifact rule from the OpenSpec configuration because the active
  schema does not define that artifact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a documentation and traceability change; it does not alter product behavior,
database schema, API contracts, or user-visible functionality.

## Impact

- Documentation: `README.md`, `backend/README.md`, `frontend/README.md`, and a new post-review
  remediation record.
- OpenSpec: this documentation-only change uses `skip_specs: true`; archived historical artifacts
  remain immutable, and `openspec/config.yaml` loses one invalid artifact rule.
- Verification: documentation links, route and endpoint descriptions, and recorded commands must
  match the current implementation.
- No runtime code, migrations, dependencies, API behavior, or database data changes.
