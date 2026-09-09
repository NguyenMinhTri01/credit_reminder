# Credit Card Management Post-Review Remediation

## Status and Scope

The original `credit-card-management` OpenSpec change is archived at
[`openspec/changes/archive/2026-09-06-credit-card-management`](../openspec/changes/archive/2026-09-06-credit-card-management/).
Those artifacts describe the plan and decisions as they existed when that change was archived.
This document is the forward-looking record for corrections accepted during post-review and does
not redefine the product requirements in the current main specifications.

The remediation hardens existing behavior and documentation. It does not add a product feature,
change the public API contract, or introduce a new database schema.

## Remediation Areas

| Area | Current behavior | Implementation references |
| --- | --- | --- |
| Balance concurrency | Transaction balance effects use atomic database increments; reconciliation reads and updates the card under a row lock inside the database transaction. | [`transactions.service.ts`](../backend/src/transactions/transactions.service.ts), [`credit-cards.service.ts`](../backend/src/credit-cards/credit-cards.service.ts) |
| Boundary validation | Shared validators enforce positive decimal strings and evaluate the minimum expiry year at request time. Nullable update values are validated rather than silently skipped. | [`validation.utils.ts`](../backend/src/shared/utils/validation.utils.ts), [`create-credit-card.dto.ts`](../backend/src/credit-cards/dto/create-credit-card.dto.ts), [`update-credit-card.dto.ts`](../backend/src/credit-cards/dto/update-credit-card.dto.ts) |
| Transaction pagination | Query parameters are validated before reaching the service, and Swagger documents the paginated `{ items, meta }` response envelope. | [`transactions-pagination.dto.ts`](../backend/src/transactions/dto/transactions-pagination.dto.ts), [`transaction-response.dto.ts`](../backend/src/transactions/dto/transaction-response.dto.ts), [`transactions.controller.ts`](../backend/src/transactions/transactions.controller.ts) |
| Card UI resilience | Bank-logo fallback state follows the selected bank, card-list failures expose retry feedback, expiry months are range-checked, transaction dates use the local calendar date, and transaction pages clamp after data removal. | [`bank-logo.tsx`](../frontend/src/components/cards/bank-logo.tsx), [`cards-page-view.tsx`](../frontend/src/components/cards/cards-page-view.tsx), [`card-form.tsx`](../frontend/src/components/cards/card-form.tsx), [`transaction-form.tsx`](../frontend/src/components/cards/transaction-form.tsx), [`transaction-list.tsx`](../frontend/src/components/cards/transaction-list.tsx) |
| Sidebar hydration | The server reads the persisted sidebar cookie and passes a deterministic initial state to the client provider, so server markup and the first client render agree. | [`layout.tsx`](../frontend/src/app/%28app%29/layout.tsx), [`app-shell.tsx`](../frontend/src/components/layout/app-shell.tsx), [`sidebar.tsx`](../frontend/src/components/ui/sidebar.tsx) |

## Migration Compatibility Decision

The repository contains one combined migration for the credit-card and transaction additions:
[`20260905091108_add_credit_card_management_fields/migration.sql`](../backend/prisma/migrations/20260905091108_add_credit_card_management_fields/migration.sql).

For legacy cards with a declared `credit_limit`, the migration initializes
`available_credit = credit_limit - current_balance`. When `credit_limit` is `NULL`, it preserves
`available_credit` as `NULL`. This is intentional: an unknown limit must remain unknown rather
than being represented as a real zero balance.

Editing a migration file does not change databases where an earlier definition has already run.
Before deployment, check the migration history in each target environment. If an environment
contains rows initialized by an older definition, plan a separate forward-only corrective data
migration; do not rerun or rewrite an already-applied migration in production.

## OpenSpec Validation by Lifecycle

Use a named validation command while a change is active:

```bash
openspec validate fix-post-review-credit-card-management --strict
```

After changes are archived, validate the complete archive rather than addressing an archived
change by its former active name:

```bash
openspec validate --archived --strict
```

Validate the current main specifications independently:

```bash
openspec validate --specs --strict
```

The current product contracts remain under [`openspec/specs`](../openspec/specs/). Request and
response schema details for the running backend remain available through Swagger at
`http://localhost:3001/api/docs`.
