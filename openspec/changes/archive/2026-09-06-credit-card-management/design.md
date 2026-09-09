## Context

The application has a working dashboard that displays credit cards with basic fields (`bankName`, `cardName`, `cardNumberMasked`, `creditLimit`, `currentBalance`, `dueDay`) and computes `availableCredit = creditLimit − currentBalance` on the fly. The "Add card" button and "Cards" sidebar link are disabled coming-soon placeholders. There is no credit-card CRUD module, no transaction module, and no bank catalog. The dashboard calculates due dates by treating `dueDay` as a fixed day in the month.

See [proposal.md](./proposal.md) for motivation and full scope.

Key constraints from the existing codebase:
- Prisma 7 + PostgreSQL with `Decimal(15,2)` for money; all monetary API values use decimal strings.
- NestJS 11 with `class-validator` DTOs, Swagger decorators, JWT auth guard.
- Next.js 16 App Router; dashboard page is a Server Component calling `apiClient`; client mutations need an explicit `accessToken`.
- `apiClient.delete()` calls `response.json()` — will crash on 204 No Content.
- `next-intl` with `vi.json`/`en.json` message files; new namespaces needed for cards/transactions.
- Backend coverage threshold is 90% across branches/functions/lines/statements.
- Existing `Transaction` model has `onDelete: Cascade` from `CreditCard` — must not cascade-delete when soft-deleting a card.

## Goals / Non-Goals

**Goals:**
- Full card CRUD with bank catalog selection, soft delete, and ownership enforcement.
- Manual transaction entry (expense, payment, refund) with atomic balance updates.
- Manual reconciliation with audit trail.
- Statement-cycle-based due-date calculation shared between dashboard and cards.
- Three-month card-expiry warnings.
- Seamless dashboard integration (same numbers, same dates, same warnings).
- Migration that preserves all existing data.

**Non-Goals:**
- Gmail/bank sync or automated transaction import.
- Statement management, payment confirmation, or debt tracking per billing cycle.
- Real-time notifications (email, push, Zalo, WebSocket, SSE).
- Search, filtering, or quick-update features on the card list (may add later).
- Duplicate-card detection (same bank + last four does not prove same card).
- Weekend/holiday adjustment for due dates.

## Decisions

### D1: Available-credit model — stored running balance vs. computed from transactions

**Decision**: Store `availableCredit` as a column on `CreditCard`, updated atomically with each transaction inside a database transaction. Derive `usedAmount = creditLimit − availableCredit` at read time.

**Rationale**: Computing from the full transaction history on every read is expensive and incompatible with reconciliation (reconciliation resets the baseline, making old transactions irrelevant). A stored running balance with atomic updates is simpler and matches the reconciliation use case.

**Alternative considered**: Compute `availableCredit` by summing all transactions since the last reconciliation. Rejected because it requires scanning all transactions on every read and becomes fragile when transactions are edited/deleted across reconciliation boundaries.

### D2: Reconciliation boundary — prevent edits to pre-reconciliation transactions

**Decision**: Transactions created before `lastReconciledAt` are immutable. Editing or deleting them is rejected with a clear error. Only post-reconciliation transactions can be modified.

**Rationale**: The reconciled value already incorporates pre-reconciliation activity. Allowing edits to those transactions would double-count or un-count changes already baked into the baseline. This is the simplest rule that avoids inconsistency.

**Alternative considered**: Recompute the entire balance from the reconciliation point on every edit. Rejected — adds complexity and is fragile if the user reconciles multiple times.

### D3: Schema migration strategy for dueDay → paymentDueDaysAfterStatement

**Decision**: Add `paymentDueDaysAfterStatement` as a new nullable column. Keep `dueDay` in the schema. The due-date utility checks `paymentDueDaysAfterStatement` first; if null, falls back to the legacy `dueDay` fixed-day logic. The migration does NOT auto-convert `dueDay` values because the original intent (fixed day vs. grace period) is ambiguous without user context.

**Rationale**: Avoids data loss and incorrect assumptions. Users update their cards at their own pace. The dashboard spec already handles the fallback.

**Alternative considered**: Remove `dueDay` and require users to re-enter. Rejected — breaks existing data and forces immediate action.

### D4: Soft delete with deletedAt timestamp

**Decision**: Add `deletedAt DateTime?` to `CreditCard`. All list/aggregate queries add `WHERE deletedAt IS NULL`. A restore endpoint sets `deletedAt = null`. The existing `onDelete: Cascade` on the `Transaction` relation is kept for physical deletes (database-level safety) but soft delete never triggers it.

**Rationale**: Meets the confirmed requirement for recoverability. Using a timestamp rather than a boolean enables audit trails and future "deleted within X days" policies.

**Alternative considered**: Boolean `isDeleted`. Rejected — timestamp is strictly more informative at no extra cost.

### D5: Bank catalog as a backend constant exposed via API

**Decision**: Define the catalog as a TypeScript constant array in `backend/src/shared/constants/bank-catalog.ts`. Expose it via `GET /credit-cards/banks`. Frontend fetches from the API rather than maintaining its own copy.

**Rationale**: Single source of truth. Adding a bank requires only a backend code change + deployment. No database table needed for a rarely changing, small dataset (14 entries).

**Alternative considered**: Database table with admin CRUD. Rejected — over-engineering for a static list of 14 banks with no user-facing management requirement.

### D6: Logo assets — static files in the frontend public directory

**Decision**: Store bank logos as SVG or PNG files in `frontend/public/images/banks/{bankCode}.svg`. The bank catalog constant includes a `logoPath` field (`/images/banks/{bankCode}.svg`). The frontend uses a `<BankLogo>` component with an `onError` fallback to a generic bank icon.

**Rationale**: Static assets are cacheable and simple. SVG preferred for quality at any size. Fallback ensures the UI never breaks on a missing logo.

### D7: currentBalance migration — rename semantic, preserve data

**Decision**: Rename the column concept from "current balance" (ambiguous debt-like meaning) to "available credit" in the application layer. In the database migration:
1. Add `available_credit Decimal(15,2)` column, default to `credit_limit − current_balance` for existing rows (or `0` if `credit_limit` is null).
2. Keep `current_balance` temporarily for rollback safety; mark as `@deprecated` in the Prisma schema with a comment.
3. A follow-up migration (out of scope) drops `current_balance` after confirming data integrity.

**Rationale**: `currentBalance` was used as "amount spent" in the dashboard formula `availableCredit = creditLimit − currentBalance`. The new model stores `availableCredit` directly. Migration computes the initial value from existing data so dashboards remain consistent.

### D8: Idempotency for transaction creation

**Decision**: Accept an optional `idempotencyKey` (UUID) in the create-transaction request. Store it on the `Transaction` row with a unique index scoped to the card. If a duplicate key is submitted, return the existing transaction without modifying the balance.

**Rationale**: Prevents double-counting on network retries. Scoping to the card keeps the uniqueness domain manageable.

### D9: API response for DELETE — return JSON, not 204

**Decision**: All DELETE endpoints return `200` with a JSON body `{ "message": "..." }` instead of `204 No Content`.

**Rationale**: The existing `apiClient` calls `response.json()` on all responses. Returning 204 would require either modifying the shared client or adding special handling. Returning JSON is simpler and consistent with the project's existing response pattern.

### D10: Client-side authentication for mutations

**Decision**: Client components use the `useSession()` hook from `next-auth` to obtain `session.accessToken` and pass it to `apiClient` calls. No server-side proxy or route handler is introduced for this change.

**Rationale**: The auth system already provides the access token in the session. This is the simplest approach that works with the existing `apiClient.resolveAccessToken` fallback chain.

### D11: Due-date utility — shared module between dashboard and cards

**Decision**: Extract the due-date calculation into `backend/src/shared/utils/schedule.utils.ts` with a single function `calculateNextPaymentDue(statementDay, paymentDueDaysAfterStatement, dueDay, now, timeZone)`. Both `DashboardService` and `CreditCardsService` import from the same location. The legacy `calculateNextDueDate` function in `dashboard-date.utils.ts` is deprecated and redirects to the new utility.

**Rationale**: Eliminates the risk of divergent date logic between two modules. The function signature accepts both new and legacy fields for backward compatibility.

### D12: Transaction type enum

**Decision**: Add a Prisma enum `TransactionType` with values `EXPENSE`, `PAYMENT`, `REFUND`, `ADJUSTMENT`. `ADJUSTMENT` is system-generated during reconciliation and cannot be created manually.

**Rationale**: Explicit enum makes the balance direction unambiguous. `ADJUSTMENT` captures reconciliation deltas for audit without being confused with user-entered transactions.

### D13: Bank select trigger single-logo and compact label layout

**Decision**: Disentangle the trigger presentation from the dropdown option content. The select trigger will render exactly one `BankLogo` component alongside the bank's compact `shortName` label. The label container will apply `truncate min-w-0` so long names never cause multiline wrapping or vertical expansion on narrow mobile screens. Dropdown menu items continue to render full names and logos for comprehensive discovery. Radix `ItemText` and `textValue` attributes are preserved to guarantee full keyboard navigation and accessible naming.

**Rationale**: Radix UI's `SelectValue` clones children of selected `SelectItem` by default; when both trigger and item include a logo, duplicate logos appear. Providing controlled trigger content avoids duplicate rendering while keeping full option metadata in the dropdown.

### D14: Precision-safe money input formatter and canonical serialization

**Decision**: Create a shared frontend utility `money-input.utils.ts` providing bidirectional transformation between user input and canonical API values:
1. **Presentation**: Format numbers with comma thousand separators, decimal point, and exactly two decimal places, followed by the currency adornment (e.g. `400,000.00đ`).
2. **Canonical payload**: Strip grouping commas, currency symbols, and whitespace, producing an unformatted decimal string (e.g. `400000.00`) for API mutations.
3. **No floating-point source of truth**: String/integer based parsing avoids IEEE 754 precision issues with large balances.
4. **Controlled integration**: Connect money inputs via React Hook Form `Controller` with `type="text"` and `inputMode="decimal"`. Handle typing, deletion, middle-string edits, and pasting gracefully without cursor jumps.

**Rationale**: Vietnamese currency values quickly exceed millions or billions. Standard HTML `type="number"` inputs reject comma formatting, drop precision on large numbers, and produce poor mobile UX. Dedicated string-level parsing and formatting guarantees that the API contract (decimal string) is preserved without floating-point artifacts.

### D15: Strict ASCII 4-digit input filtering and validation

**Decision**: Sanitize the `lastFourDigits` input directly during typing and pasting to accept only ASCII digits `[0-9]`, enforcing `maxLength={4}` and `inputMode="numeric"`. Preserve leading zeros (e.g. `0012`) through form state, submission payload, and API responses. Backend DTO validation reinforces this via `@Matches(/^\d{4}$/)`.

**Rationale**: Early sanitization at the UI boundary prevents invalid characters or excessive digits from entering the form state while providing immediate feedback to users. Backend verification remains the ultimate defense.

### D16: Non-overlapping header actions in card detail sheet

**Decision**: Adjust the `SheetHeader` layout in `CardDetailView` by providing explicit right spacing (e.g. `pr-12` or distinct action bar positioning) so that the "Edit" button does not collide with or obscure `SheetPrimitive.Close` at `top-4 right-4`.

**Rationale**: `SheetPrimitive.Close` is positioned absolutely at the top right of `SheetContent`. Without dedicated spacing in the header, flex items positioned at `justify-between` align right up against the right edge, causing interactive click collisions and visual overlap across desktop and mobile screens.

## Risks / Trade-offs

- **[Risk] Concurrent balance updates under high contention** → Mitigation: Use Prisma's `$transaction` with serializable isolation or optimistic locking (`UPDATE ... WHERE availableCredit = expectedValue`). For the MVP manual-entry use case, contention is extremely low.

- **[Risk] Migration computes wrong initial availableCredit** → Mitigation: The migration uses `credit_limit − current_balance` which matches the dashboard's existing formula. Add a verification query in the migration to log any rows where the result is null or unexpected.

- **[Risk] Legacy cards without paymentDueDaysAfterStatement show stale due dates** → Mitigation: Fallback to `dueDay` logic preserves current behavior. The UI can display a prompt encouraging the user to update their card settings.

- **[Trade-off] Keeping currentBalance column temporarily** → Adds slight schema clutter but ensures safe rollback. Acceptable for one release cycle.

- **[Trade-off] Pre-reconciliation transactions become immutable** → Users cannot fix mistakes made before reconciliation. Acceptable because reconciliation is an explicit "I trust this number" action. Users can reconcile again to correct.

- **[Trade-off] No search/filter on card list** → The initial card list is unfiltered. For users with many cards, this could be inconvenient. Acceptable for MVP; the proposal notes this as a future enhancement.

## Migration Plan

### Step 1: Database migration (backward-compatible)
1. Add new columns to `credit_cards`: `bank_code`, `last_four_digits`, `expiry_month`, `expiry_year`, `payment_due_days_after_statement`, `available_credit`, `last_reconciled_at`, `deleted_at`, `updated_at`. All nullable initially.
2. Add `TransactionType` enum and `type` column (default `EXPENSE`) to `transactions`. Add `reconciled_at`, `idempotency_key` columns.
3. Data migration script:
   - Populate `available_credit` = `credit_limit − current_balance` where `credit_limit` is not null; set to `0` where null.
   - Extract last 4 digits from `card_number_masked` where pattern matches `•••• XXXX` format; leave null otherwise.
   - Map known `bank_name` values to `bank_code` where unambiguous; leave null otherwise.
4. Add unique index on `(card_id, idempotency_key)` for transactions.

### Step 2: Deploy backend with new modules
- Register `CreditCardsModule` and `TransactionsModule`.
- Update `DashboardService` to use new fields with fallback.
- All new endpoints are behind JWT auth.

### Step 3: Deploy frontend
- Add `/cards` route and update navigation.
- Update dashboard components to use new response fields.

### Rollback strategy
- The migration only adds columns and does not remove or rename existing ones.
- Rolling back the backend deploy restores the old dashboard code that reads `currentBalance` and `dueDay`, which are still present.
- The `available_credit` column is ignored by the old code.
- If a full rollback is needed, the new columns can be dropped in a reverse migration.
