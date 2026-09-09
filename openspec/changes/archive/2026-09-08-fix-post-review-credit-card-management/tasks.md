## 1. Post-Review Traceability Record

- [x] 1.1 Create `docs/credit-card-management-post-review.md` that records the post-review remediation scope, links the affected implementation areas, and states that the archived credit-card-management artifacts remain historical records; verify every referenced local path exists.
- [x] 1.2 Document the canonical migration compatibility decision: the single combined migration preserves `NULL` `available_credit` for legacy cards without a credit limit, and a corrective production data migration requires a separate change if an older deployed definition needs repair; verify the statement matches `backend/prisma/migrations/20260905091108_add_credit_card_management_fields/migration.sql`.
- [x] 1.3 Record lifecycle-aware OpenSpec commands for active changes, archived changes, and current specs; verify `openspec validate --archived --strict` and `openspec validate --specs --strict` are the documented commands for archival and main-spec validation.

## 2. Repository Documentation

- [x] 2.1 Update `README.md` to state the installed Next.js major version and the local backend/frontend shared-code layout, removing references to a non-existent shared workspace package; verify statements against `frontend/package.json` and the repository tree.
- [x] 2.2 Update `backend/README.md` with the credit-cards and transactions modules, their nested transaction routes, and a concise endpoint inventory that defers request/response schemas to Swagger; verify every documented route matches the controllers.
- [x] 2.3 Update `frontend/README.md` with the authenticated cards route, cards feature components, credit-card/transaction hooks, local shared code, and bank-logo assets; verify every listed path exists.

## 3. Documentation Verification

- [x] 3.1 Review the documentation diff for stale version numbers, invalid paths, contradicting migration claims, and accidental archived-artifact edits; verify with `git diff --check` and targeted `rg` searches.
- [x] 3.2 Remove the unsupported `rules.verification` entry from `openspec/config.yaml`; verify `openspec instructions proposal --change fix-post-review-credit-card-management --json` completes without an unknown-artifact warning.
- [x] 3.3 Run `openspec validate fix-post-review-credit-card-management --strict`, `openspec validate --archived --strict`, and `openspec validate --specs --strict`; verify all commands exit successfully, allowing only documented informational warnings.
