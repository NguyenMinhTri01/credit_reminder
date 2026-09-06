## Why

Users currently see credit cards on the dashboard but cannot create, edit, or delete them through the application — the "Add card" button and the "Cards" sidebar item are disabled placeholders. The dashboard computes available credit and due dates from a simplified schema that lacks several fields the business requires (expiry date, grace period, bank catalog, four-digit suffix, reconciliation tracking). There is no transaction entry workflow, so the displayed available credit is static and cannot reflect real spending or payments.

This change introduces a fully functional credit-card management page, a manual transaction workflow that keeps the available-credit figure in sync with spending and payments, a manual reconciliation mechanism, statement-cycle-based due-date calculation, and card-expiry warnings — all integrated with the existing dashboard so that numbers, dates, and alerts stay consistent.

Additionally, this refinement addresses critical UI polish and usability issues identified during user testing: duplicate bank logos and multiline wrapping in the bank select trigger, unformatted raw number inputs for money fields across card and transaction forms, loose input sanitization on the last-four-digits field, and an interactive overlap where the sheet close button covers the edit button in the card detail sheet.

## What Changes

- **New `/cards` page** with list, create, view detail, edit, and soft-delete flows, including bank selection from a code-managed catalog with logos.
- **Bank select trigger polish**: Ensure the trigger renders exactly one bank logo and uses a compact `shortName` label with ellipsis truncation (`min-w-0`), preventing control height bloating while preserving full bank names in dropdown options and Radix accessibility labels.
- **Consistent money input formatting and canonical serialization**: Standardize money inputs (`creditLimit`, `availableCredit`, transaction `amount`) to display grouped VND currency with two decimal places (`400,000.00đ`) without floating-point precision loss, and serialize to canonical decimal strings (`400000.00`) on submit.
- **Strict last-four-digits validation**: Restrict the `lastFourDigits` input to exactly four ASCII numeric digits (`0-9`), filtering invalid characters at the UI boundary, preserving leading zeros (e.g. `0012`), and syncing with backend DTO constraints.
- **Card detail sheet header layout**: Ensure the sheet close icon and the "Edit" action button have separate, non-overlapping click targets on mobile, tablet, and desktop viewports.
- **Schema migration** of `CreditCard`: add `bankCode`, `lastFourDigits` (required 4-char string), `expiryMonth`/`expiryYear`, `paymentDueDaysAfterStatement` (replaces the fixed `dueDay` semantic), `availableCredit`, `lastReconciledAt`, `deletedAt` (soft delete); keep `cardName` optional as a user-friendly alias; migrate `cardNumberMasked` data into `lastFourDigits` where extractable.
- **Schema migration** of `Transaction`: add `type` enum (`EXPENSE`, `PAYMENT`, `REFUND`, `ADJUSTMENT`) so the direction of each transaction is explicit; add `reconciledAt` to distinguish pre- vs. post-reconciliation transactions.
- **New backend module `credit-cards`** (CRUD + reconciliation endpoint + bank-catalog endpoint) with ownership guards, DTOs, Swagger docs, and Decimal-string monetary serialization.
- **New backend module `transactions`** (create, list by card, edit, delete) with automatic `availableCredit` updates on the card, idempotency safeguards, and ownership checks.
- **Available-credit lifecycle**: initial value set at card creation; decremented by expenses, incremented by payments/refunds; manual reconciliation resets the baseline and records a timestamp; subsequent transactions apply on top of the reconciled value. Limit changes recalculate available credit while preserving the used amount.
- **Due-date calculation rewrite**: replace the fixed `dueDay`-in-month approach with statement-day + grace-period logic that finds the nearest upcoming due date (including cycles whose statement closed in a prior month). Shared utility used by both dashboard and cards page.
- **Card-expiry warnings**: three-calendar-month pre-expiry and post-expiry badges on card tiles and dashboard, computed at data-load time.
- **Dashboard integration**: dashboard service and frontend consume the new schema fields, replace coming-soon buttons with working links/actions, and invalidate/revalidate data after card or transaction mutations.
- **Bank catalog**: constant registry of 14 Vietnamese banks and finance companies (Big 4, private, international, finance company) with stable code, display name, and logo path; exposed via a read-only API endpoint so frontend does not maintain a separate copy.
- **i18n**: new `cards` and `transactions` namespaces in `vi.json` / `en.json` for all user-facing strings.
- **Soft delete**: deleted cards are excluded from listings and aggregates but remain recoverable; cascade behavior with transactions is preserved logically; delete confirmation UI explains the impact.

## Capabilities

### New Capabilities

- `credit-card-crud`: Full lifecycle management of credit cards (create, read, update, soft-delete, restore) with bank-catalog selection, four-digit validation, expiry tracking, and ownership enforcement.
- `credit-card-available-credit`: Available-credit bookkeeping via manual transactions (expense, payment, refund) and manual reconciliation, including the invariant that limit − availableCredit = usedAmount.
- `credit-card-schedule`: Statement-cycle-based due-date calculation and card-expiry warning logic, shared between the cards page and the dashboard.

### Modified Capabilities

- `dashboard-overview`: Due-date calculation changes from fixed `dueDay` to statement-day + grace-period; the "Add card" button becomes a working link to `/cards`; the "Cards" navigation item becomes active; dashboard summary and card tiles consume the new available-credit and expiry fields.

## Impact

- **Database**: Two Prisma migrations — one for `CreditCard` column additions / renames and soft-delete, one for `Transaction.type` enum and reconciliation timestamp. Existing data preserved with compatibility defaults.
- **Backend modules**: New `CreditCardsModule` and `TransactionsModule` registered in `AppModule`; `DashboardModule` updated to use the new date and money utilities.
- **API surface**: New endpoints under `/credit-cards` and `/credit-cards/:id/transactions`; existing `GET /dashboard` response shape gains expiry and schedule fields.
- **Frontend routing**: New `(app)/cards/` route group; sidebar navigation and dashboard CTAs updated.
- **Frontend components & utilities**: Shared money input formatting utility (`money-input.utils.ts`), bank select component adjustments, and non-overlapping header layout in `card-detail-view.tsx`.
- **Shared code**: New constants (`BANK_CATALOG`, card/transaction messages), types, and enums added to `backend/src/shared/` and `frontend/src/shared/`.
- **i18n files**: `vi.json` and `en.json` gain `cards` and `transactions` namespaces, updated with form field and validation messages.
- **Test coverage**: New service/util unit tests must meet the project's 90% threshold; dashboard tests updated for the new date logic; new tests for money inputs, bank select single-logo behavior, and card detail sheet layout.
