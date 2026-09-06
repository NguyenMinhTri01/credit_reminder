## 1. Database Schema & Migration

- [x] 1.1 Add `TransactionType` enum (`EXPENSE`, `PAYMENT`, `REFUND`, `ADJUSTMENT`) to `backend/prisma/schema.prisma`. Verify: `pnpm db:generate` succeeds and the enum appears in the generated Prisma client.
- [x] 1.2 Update `CreditCard` model: add nullable columns `bankCode String?`, `lastFourDigits String? @db.Char(4)`, `expiryMonth Int?`, `expiryYear Int?`, `paymentDueDaysAfterStatement Int?`, `availableCredit Decimal? @db.Decimal(15,2)`, `lastReconciledAt DateTime?`, `deletedAt DateTime?`, `updatedAt DateTime @default(now()) @updatedAt`. Keep existing columns (`bankName`, `cardNumberMasked`, `currentBalance`, `dueDay`) untouched. Verify: `pnpm db:generate` succeeds with no errors.
- [x] 1.3 Update `Transaction` model: add `type TransactionType @default(EXPENSE)`, `reconciledAt DateTime?`, `idempotencyKey String? @db.Uuid`. Add unique index `@@unique([cardId, idempotencyKey])`. Verify: `pnpm db:generate` succeeds.
- [x] 1.4 Create the Prisma migration with `pnpm db:migrate` (name: `add-credit-card-management-fields`). Write a data migration SQL block inside the migration file that: (a) populates `available_credit = credit_limit - current_balance` for rows where `credit_limit IS NOT NULL`, defaults to `0` otherwise; (b) extracts last 4 chars from `card_number_masked` into `last_four_digits` where the pattern matches `•••• XXXX`; (c) maps known `bank_name` values to `bank_code` for unambiguous matches. Verify: migration applies cleanly on a fresh database and existing seed data is preserved with correct `available_credit` values.

## 2. Backend Shared Constants, Types & Utils

- [x] 2.1 Create `backend/src/shared/constants/bank-catalog.ts` with the 14-bank constant array (Vietcombank, BIDV, VietinBank, Agribank, VPBank, Techcombank, Sacombank, VIB, MBBank, ACB, UOB, HSBC, Standard Chartered, Home Credit). Each entry: `bankCode` (kebab-case stable key), `name`, `shortName`, `logoPath` (`/images/banks/{bankCode}.svg`), `category`. Export a lookup function `findBankByCode(code: string)`. Verify: import from test file resolves, `findBankByCode('vietcombank')` returns the correct entry, unknown code returns `undefined`.
- [x] 2.2 Add `CREDIT_CARD_MESSAGES` and `TRANSACTION_MESSAGES` constant objects to `backend/src/shared/constants/messages.ts` covering all error, success, and Swagger description strings needed by the new modules. Verify: all string keys are referenced in DTOs/services (no unused, no missing).
- [x] 2.3 Add credit card and transaction types/interfaces to `backend/src/shared/types/index.ts`: `ICreditCard`, `ICreditCardDetail`, `ICreditCardListItem`, `ITransaction`, `ICreateCreditCardDto`, `IUpdateCreditCardDto`, `ICreateTransactionDto`, `IReconcileDto`. Verify: types compile with `pnpm build`.
- [x] 2.4 Create `backend/src/shared/utils/schedule.utils.ts` with `calculateNextPaymentDue(statementDay, paymentDueDaysAfterStatement, dueDay, now, timeZone)` implementing the statement-cycle algorithm: find the most recent statement close date ≤ today, add grace period days, check if due date ≥ today, advance cycle if not. Return `{ statementDate, nextDueDate, daysUntilDue }`. Verify: unit tests pass for the required scenarios — prior-month cycle (2026-09-05, SD=20, grace=20 → due 2026-09-09, 4 days), past due advances cycle, Feb/short months, year boundary, `daysUntilDue=0`, legacy fallback with `dueDay` only.
- [x] 2.5 Create `backend/src/shared/utils/expiry.utils.ts` with `getExpiryStatus(expiryMonth, expiryYear, now, timeZone)` returning `{ expiryDate, warningStartDate, status: 'valid' | 'expiring_soon' | 'expired' }`. Implement three-calendar-month subtraction with last-day-of-month clamping. Verify: unit tests for `03/30` → warning from `2029-12-31`, expired from `2030-04-01`; edge case `05/26` → warning from `2026-02-28`; null inputs return null status.
- [x] 2.6 Write comprehensive unit tests for `schedule.utils.ts` (≥ 90% coverage). Cover: standard case, past-due advance, short months (Feb 28/29), year boundary, `daysUntilDue=0`, legacy `dueDay` fallback, null/invalid inputs. Verify: `pnpm test -- --testPathPattern schedule.utils` passes with ≥ 90% branch coverage.
- [x] 2.7 Write comprehensive unit tests for `expiry.utils.ts` (≥ 90% coverage). Cover: normal warning period, exact boundary dates, expired status, null inputs, leap year February. Verify: `pnpm test -- --testPathPattern expiry.utils` passes with ≥ 90% branch coverage.

## 3. Backend Credit Cards Module

- [x] 3.1 Create `backend/src/credit-cards/` module structure: `credit-cards.module.ts`, `credit-cards.controller.ts`, `credit-cards.service.ts`, `dto/` directory. Register `CreditCardsModule` in `AppModule`. Verify: application starts without errors with `pnpm dev:backend`.
- [x] 3.2 Create DTOs with `class-validator` decorators and Swagger annotations: `CreateCreditCardDto` (bankCode required + catalog validation, lastFourDigits exactly 4 digits, creditLimit decimal string > 0, availableCredit decimal string, statementDay 1–31, paymentDueDaysAfterStatement > 0, expiryMonth 1–12, expiryYear ≥ current year, cardName optional), `UpdateCreditCardDto` (all fields optional with same validators), `CreditCardResponseDto`, `ReconcileCreditCardDto` (availableCredit decimal string required). Verify: validation rejects invalid data in unit tests (wrong digit count, out-of-range statementDay, non-numeric lastFourDigits, negative creditLimit).
- [x] 3.3 Implement `CreditCardsService.create()`: validate `bankCode` against catalog, create card with `userId` from auth, store monetary values as Decimal. Verify: integration test creates a card and returns it with resolved bank name/logo.
- [x] 3.4 Implement `CreditCardsService.findAll(userId)`: query with `WHERE userId = ? AND deletedAt IS NULL`, order by `createdAt ASC`. Compute and attach `utilizationPercent`, bank display info, schedule info (using `calculateNextPaymentDue`), and expiry status (using `getExpiryStatus`). Verify: returns only the user's non-deleted cards with all computed fields.
- [x] 3.5 Implement `CreditCardsService.findOne(id, userId)`: fetch card where `id`, `userId` match and `deletedAt IS NULL`. Return 404 if not found/not owned/deleted. Verify: returns card for owner, 404 for non-owner, 404 for deleted card.
- [x] 3.6 Implement `CreditCardsService.update()`: partial update of metadata fields. If `creditLimit` changes, recalculate `availableCredit` preserving used amount (`newAvailable = newLimit - (oldLimit - oldAvailable)`). Validate `bankCode` if provided. Verify: updating `creditLimit` from 50M to 80M with `availableCredit` 30M results in `availableCredit` 60M; updating `cardName` alone does not change `availableCredit`.
- [x] 3.7 Implement `CreditCardsService.softDelete(id, userId)`: set `deletedAt = now()`. Return 200 with JSON message (not 204). Verify: card disappears from `findAll` but database record exists with `deletedAt` set.
- [x] 3.8 Implement `CreditCardsService.restore(id, userId)`: clear `deletedAt` for the user's card. Verify: restored card reappears in `findAll` and `findOne`.
- [x] 3.9 Implement `CreditCardsService.reconcile(id, userId, dto)`: set `availableCredit` to the provided value, update `lastReconciledAt`, create an `ADJUSTMENT` transaction with the delta amount. All within a `$transaction`. Verify: reconcile from 55M to 62M creates an ADJUSTMENT of +7M and sets `lastReconciledAt`.
- [x] 3.10 Implement `GET /credit-cards/banks` endpoint returning the bank catalog array. Verify: response contains 14 entries with correct structure.
- [x] 3.11 Set up controller routes with JWT guard, Swagger decorators, and ownership enforcement: `POST /credit-cards`, `GET /credit-cards`, `GET /credit-cards/:id`, `PATCH /credit-cards/:id`, `DELETE /credit-cards/:id`, `POST /credit-cards/:id/restore`, `POST /credit-cards/:id/reconcile`, `GET /credit-cards/banks`. Verify: Swagger docs at `/api/docs` show all endpoints with correct DTOs.
- [x] 3.12 Write unit tests for `CreditCardsService` (≥ 90% coverage). Mock `PrismaService`. Cover: create, list, detail, update (with/without limit change), soft-delete, restore, reconcile, ownership enforcement, bank code validation, legacy data handling. Verify: `pnpm test -- --testPathPattern credit-cards.service` passes.

## 4. Backend Transactions Module

- [x] 4.1 Create `backend/src/transactions/` module structure: `transactions.module.ts`, `transactions.controller.ts`, `transactions.service.ts`, `dto/` directory. Register `TransactionsModule` in `AppModule`. Verify: application starts without errors.
- [x] 4.2 Create DTOs: `CreateTransactionDto` (type: EXPENSE|PAYMENT|REFUND required, amount decimal string > 0, transactionDate YYYY-MM-DD, description optional, merchant optional, idempotencyKey optional UUID), `UpdateTransactionDto` (type, amount, transactionDate, description, merchant — all optional), `TransactionResponseDto`. Verify: validation rejects missing type, invalid amount, invalid date format.
- [x] 4.3 Implement `TransactionsService.create()`: within a `$transaction`, create the transaction record and atomically update the card's `availableCredit` based on type (EXPENSE: subtract, PAYMENT/REFUND: add). Check idempotency key — if duplicate, return existing transaction. Verify card ownership first. Verify: expense of 5M on 60M available → 55M; payment of 10M on 55M → 65M; duplicate idempotency key returns same transaction without balance change.
- [x] 4.4 Implement `TransactionsService.update()`: check reconciliation boundary — reject if transaction `createdAt < card.lastReconciledAt`. Within a `$transaction`, reverse the old effect and apply the new effect. Verify: editing expense 5M→7M decreases available by 2M; changing type from EXPENSE to PAYMENT reverses and reapplies; pre-reconciliation edit is rejected with error.
- [x] 4.5 Implement `TransactionsService.delete()`: check reconciliation boundary. Within a `$transaction`, reverse the transaction's effect on `availableCredit` and delete the record. Return 200 with JSON message. Verify: deleting an expense of 5M increases available by 5M; pre-reconciliation delete is rejected.
- [x] 4.6 Implement `TransactionsService.findAllByCard(cardId, userId, pagination)`: paginated list ordered by `transactionDate DESC`, only for non-deleted cards owned by the user. Verify: returns paginated results, 404 for non-owned or deleted card.
- [x] 4.7 Set up controller routes nested under cards: `POST /credit-cards/:cardId/transactions`, `GET /credit-cards/:cardId/transactions`, `PATCH /credit-cards/:cardId/transactions/:id`, `DELETE /credit-cards/:cardId/transactions/:id`. JWT guard and Swagger decorators. Verify: Swagger docs show all endpoints.
- [x] 4.8 Write unit tests for `TransactionsService` (≥ 90% coverage). Cover: create (all types), idempotency, edit (with/without type change), delete, reconciliation boundary enforcement, concurrent update scenario, ownership checks, pagination. Verify: `pnpm test -- --testPathPattern transactions.service` passes.

## 5. Dashboard Integration (Backend)

- [x] 5.1 Update `DashboardService.getSnapshot()` to: (a) filter cards with `deletedAt: null`; (b) use `availableCredit` from the stored field instead of computing `creditLimit - currentBalance`; (c) call `calculateNextPaymentDue()` from the shared utility instead of the legacy `calculateNextDueDate()`; (d) add `expiryStatus` to each card entry using `getExpiryStatus()`; (e) add `statementDate` to each card's schedule info. Verify: dashboard response includes new fields and excludes soft-deleted cards.
- [x] 5.2 Update `DashboardSnapshotDto` and `IDashboardCard` type to include `availableCredit` (string), `expiryStatus` (`valid`|`expiring_soon`|`expired`|null), `statementDate` (string|null). Verify: Swagger docs reflect the updated response shape.
- [x] 5.3 Deprecate `calculateNextDueDate` in `dashboard-date.utils.ts` — make it a thin wrapper that delegates to the new shared `calculateNextPaymentDue` for backward compatibility. Verify: existing dashboard tests still pass.
- [x] 5.4 Update `aggregateDashboardMoney()` to use `availableCredit` directly instead of `creditLimit - currentBalance`. Verify: summary totals match when using stored `availableCredit`.
- [x] 5.5 Update dashboard unit tests for the new behavior (soft-delete filtering, new date logic, expiry status, stored available credit). Verify: `pnpm test -- --testPathPattern dashboard` passes with ≥ 90% coverage.

## 6. Frontend Shared Code & i18n

- [x] 6.1 Add credit card and transaction types to `frontend/src/shared/types/index.ts`: `ICreditCard`, `ICreditCardDetail`, `ITransaction`, `IBankCatalogEntry`, `ICreateCreditCardPayload`, `IUpdateCreditCardPayload`, `ICreateTransactionPayload`, `IReconcilePayload`. Match backend response shapes. Verify: `pnpm build` succeeds.
- [x] 6.2 Add `cards` namespace to `frontend/src/messages/vi.json` and `frontend/src/messages/en.json` with all card management strings: page title, form labels, validation messages, empty state, delete confirmation dialog text, expiry warnings, schedule labels, bank selection, transaction types. Verify: both files parse as valid JSON and contain matching keys.
- [x] 6.3 Add `transactions` namespace to both i18n files with transaction-related strings: type labels, form fields, reconciliation labels, error messages. Verify: matching keys in both files.
- [x] 6.4 Add shared constants to `frontend/src/shared/constants/index.ts`: API paths for cards and transactions endpoints, form validation limits. Verify: `pnpm build` succeeds.

## 7. Frontend Bank Logos & Components

- [x] 7.1 Add bank logo SVG/PNG files to `frontend/public/images/banks/` for all 14 banks (filenames matching `bankCode` from the catalog). Add a generic fallback icon (`generic-bank.svg`). Verify: files exist and are loadable in the browser at `/images/banks/{bankCode}.svg`.
- [x] 7.2 Create `frontend/src/components/cards/bank-logo.tsx` — a reusable `<BankLogo>` component that renders the bank logo image with `onError` fallback to the generic icon. Accepts `bankCode`, `bankName` (for alt text), and optional size props. Verify: renders correctly for a known bank and falls back gracefully for an unknown bank code or missing image.

## 8. Frontend Cards Page — List & Navigation

- [x] 8.1 Create route `frontend/src/app/(app)/cards/page.tsx` as a Server Component that fetches the card list from the API and renders `<CardsPageView>`. Verify: navigating to `/cards` renders the page without errors.
- [x] 8.2 Update `frontend/src/components/layout/navigation.ts`: add `href: '/cards'` and `active: true` to the `cards` navigation item. Verify: sidebar shows "Cards" as an active link navigating to `/cards`.
- [x] 8.3 Create `frontend/src/components/cards/cards-page-view.tsx` — client component with TanStack Query for card list, showing loading skeleton, empty state with "Add card" CTA, and the card grid. Verify: loading state shows skeletons, empty state shows CTA, card list renders card tiles.
- [x] 8.4 Create `frontend/src/components/cards/card-tile.tsx` — renders a single card with: bank logo + name, `•••• XXXX` last four digits, credit limit, available credit, utilization bar, next due date with urgency badge, expiry warning badge. Uses shared `<BankLogo>` component. Verify: renders all fields correctly, handles missing optional data gracefully.
- [x] 8.5 Update dashboard `<CreditCardGrid>` and `<CreditCardTile>` components: replace `ComingSoonButton` with a working link/button to `/cards` (or a create-card sheet). Update tile to display `availableCredit` from the response instead of computing it, show expiry badge, and use the new schedule fields. Verify: dashboard card tiles show updated data and the "Add card" button navigates to `/cards`.

## 9. Frontend Cards Page — Create & Edit Forms

- [x] 9.1 Create `frontend/src/components/cards/card-form.tsx` — shared form component for create and edit, using React Hook Form + Zod validation. Fields grouped into: bank selection (combobox with logo), card info (last four digits, card name), limits (credit limit, available credit with formatted currency input), schedule (statement day, payment due days), expiry (MM/YY input). Show live preview of next due date from entered schedule data. Verify: form validates all fields matching backend rules, rejects invalid input with field-level errors.
- [x] 9.2 Create `frontend/src/hooks/use-bank-catalog.ts` — TanStack Query hook to fetch `GET /credit-cards/banks`. Cache the result (stale time high since catalog rarely changes). Verify: hook returns bank list, loading state, and error state.
- [x] 9.3 Create `frontend/src/hooks/use-credit-cards.ts` — TanStack Query hooks for card CRUD mutations (`useCreateCard`, `useUpdateCard`, `useDeleteCard`, `useRestoreCard`, `useReconcileCard`). Each mutation invalidates the card list query and the dashboard query on success. Pass `accessToken` from `useSession()`. Verify: mutations call correct endpoints and invalidate cache.
- [x] 9.4 Implement card creation flow: "Add card" button opens the form (sheet or dedicated view), submits via `useCreateCard`, shows loading state during submission, shows success feedback and navigates to the new card or list on success, preserves form data on API error. Verify: creating a card with valid data shows it in the list; submitting invalid data shows field errors without clearing the form.
- [x] 9.5 Implement card edit flow: "Edit" action on card detail opens the form pre-filled with existing data, submits via `useUpdateCard`. Prevent double submission. Verify: editing a card updates the displayed data after save; editing `creditLimit` shows the recalculated `availableCredit`.
- [x] 9.6 Implement card delete flow: "Delete" action opens an `AlertDialog` with impact explanation (translated), confirms via `useDeleteCard`. Verify: deleted card disappears from list and dashboard.
- [x] 9.7 Implement card restore flow: provide a way to view and restore soft-deleted cards (e.g., a "Deleted cards" section or toggle). Verify: restoring a card makes it reappear in the card list and dashboard.

## 10. Frontend Cards Page — Transactions & Reconciliation

- [x] 10.1 Create `frontend/src/components/cards/transaction-list.tsx` — displays paginated transaction list for a card with type badge, amount, date, description, and edit/delete actions. Verify: renders transactions with correct formatting, pagination works.
- [x] 10.2 Create `frontend/src/components/cards/transaction-form.tsx` — form for creating/editing a transaction (type select, amount, date picker, description, merchant). Zod validation matching backend rules. Verify: validation works, form submits correctly.
- [x] 10.3 Create `frontend/src/hooks/use-transactions.ts` — TanStack Query hooks for transaction CRUD (`useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`). Mutations invalidate the card detail query and dashboard query. Verify: creating an expense updates the card's available credit display.
- [x] 10.4 Create `frontend/src/components/cards/reconcile-form.tsx` — form for manual reconciliation with a single "New available credit" input. Submits via a `useReconcileCard` mutation. Verify: reconciling updates `availableCredit` and shows `lastReconciledAt` timestamp.
- [x] 10.5 Integrate transaction list and reconciliation into the card detail view. Show the sequence: create card → add expense → add payment → reconcile → add refund, verifying available credit at each step matches the acceptance criteria from the spec (60M → 55M → 65M → 62M → 64M). Verify: end-to-end flow in the browser produces correct numbers at each step.

## 11. Dashboard Frontend Integration & Cache Invalidation

- [x] 11.1 Update `frontend/src/shared/types/index.ts` `IDashboardCard` to include `availableCredit`, `expiryStatus`, `statementDate`. Update `IDashboardSnapshot` if needed. Verify: TypeScript compiles without errors.
- [x] 11.2 Update `frontend/src/components/dashboard/credit-card-tile.tsx` to use `availableCredit` from the response, display expiry badge, and use new schedule fields for the due-date badge. Verify: dashboard tiles show correct data matching the cards page.
- [x] 11.3 Ensure cache invalidation: after any card or transaction mutation, invalidate both the card list/detail queries AND the dashboard snapshot query so that navigating to the dashboard shows fresh data. Handle Server Component data by using `router.refresh()` or `revalidatePath`. Verify: create a card on `/cards`, navigate to `/`, dashboard shows the new card with correct numbers.
- [x] 11.4 Update the dashboard empty-state "Add card" button to navigate to `/cards` instead of being disabled. Verify: button is clickable and navigates correctly.

## 12. End-to-End Verification & Cross-Cutting Concerns

- [x] 12.1 Run the full backend test suite (`pnpm test` in backend). Verify: all tests pass, overall coverage ≥ 90%.
- [x] 12.2 Run TypeScript type checking (`pnpm build`). Verify: no type errors in backend or frontend.
- [x] 12.3 Run linting (`pnpm lint`). Verify: no lint errors.
- [x] 12.4 Manually verify the acceptance scenario sequence in the browser: (a) create card with 60M available; (b) add 5M expense → 55M; (c) add 10M payment → 65M; (d) reconcile to 62M → 62M; (e) add 2M refund → 64M. Verify: numbers match at each step on both the cards page and dashboard.
- [x] 12.5 Verify ownership enforcement: sign in as user A, create a card, sign in as user B, attempt to access/modify user A's card by ID. Verify: all attempts return 404.
- [x] 12.6 Verify due-date calculation: create a card with `statementDay=20`, `paymentDueDaysAfterStatement=20` on `2026-09-05`. Verify: due date shows `2026-09-09` with 4 days remaining.
- [x] 12.7 Verify expiry warning: create a card with expiry `12/26`. Verify: on `2026-09-05`, card shows "expiring soon" badge (within 3-month window from `2026-09-30` expiry end).
- [x] 12.8 Verify mobile responsiveness: check cards page and card forms on viewport ≤ 375px width. Verify: content stacks properly, no horizontal scrolling, all form fields accessible.
- [x] 12.9 Verify i18n: switch locale to English, confirm all card/transaction strings display in English. Switch back to Vietnamese, confirm Vietnamese strings. Verify: no hardcoded strings visible.
- [x] 12.10 Verify legacy data: if any existing cards exist, confirm they display correctly with fallback handling (generic bank icon, `dueDay` fallback, "unavailable" for missing fields). Verify: no crashes or blank pages for legacy data.

## 13. UI Refinements & Polish (Bank Select, Money Formatter, Last-4 Validation, Sheet Layout)

- [x] 13.1 Create shared frontend money input utility `frontend/src/lib/money-input.utils.ts` and unit tests `frontend/src/lib/money-input.utils.test.ts`:
  - `formatMoneyInputDisplay(raw)`: formats raw number/string into `400,000.00đ` (grouping comma, decimal dot, 2 decimals, single `đ` suffix) without floating-point precision issues.
  - `parseMoneyInputToCanonicalDecimal(formatted)`: extracts unformatted canonical decimal string `400000.00` suitable for API mutations.
  - Tests covering: standard typing, pasting with/without suffix, zero, leading zeros, large balances, decimal fractions, and invalid non-numeric inputs.
  Verify: `pnpm test -- --testPathPattern money-input.utils` passes with 100% assertion success.
- [x] 13.2 Update `frontend/src/components/cards/card-form.tsx`:
  - Fix bank select: render exactly one `BankLogo` in `SelectTrigger` with `selectedBank.shortName` truncated (`min-w-0`), while dropdown options retain `bank.name` and logo; verify Radix accessibility and keyboard navigation.
  - Restrict `lastFourDigits` input to strictly 4 ASCII digits `0-9`, blocking invalid characters during input/paste and preserving leading zeros (`0012`).
  - Wire `creditLimit` and `availableCredit` to `Controller` with `money-input.utils.ts`, ensuring display `400,000.00đ` and submission of canonical decimal string `400000.00`.
  Verify: unit tests in `card-form.test.tsx` pass.
- [x] 13.3 Update `frontend/src/components/cards/transaction-form.tsx` and `frontend/src/components/cards/reconcile-form.tsx`:
  - Replace raw `type="number"` inputs with `money-input.utils.ts` controlled inputs for transaction `amount` and reconciliation `availableCredit`.
  - Ensure canonical decimal strings are transmitted on mutation submission, maintaining existing validation constraints.
  Verify: unit tests for transaction and reconciliation forms pass.
- [x] 13.4 Update `frontend/src/components/cards/card-detail-view.tsx` header layout:
  - Add explicit spacing/margin or separate container in `SheetHeader` so the "Edit" (`Sửa`) button and `SheetPrimitive.Close` have distinct, non-overlapping click targets on mobile, tablet, and desktop viewports.
  - Preserve accessible names and focus rings for both controls.
  Verify: visual inspection and layout test confirm no bounding box collision.
- [x] 13.5 Update i18n messages in `frontend/src/messages/vi.json` and `frontend/src/messages/en.json`:
  - Ensure all new validation messages and labels for bank selection, money inputs, and last-four digits are localized without hardcoded user-facing strings.
  Verify: `pnpm test` and i18n verification pass.
- [x] 13.6 Write comprehensive tests for UI polish:
  - `card-form.test.tsx`: test single logo in trigger, bank short name truncation, 4 ASCII digits validation (`0012` valid, `123`/`12345`/`12a4` invalid), money input formatting and canonical payload.
  - `card-detail-view.test.tsx`: test that both close button and edit button exist simultaneously in the DOM, with separate accessible names and click handlers.
  Verify: `pnpm test` in frontend passes.
- [x] 13.7 Verify full workspace health:
  - Run `openspec validate credit-card-management --strict`
  - Run `pnpm typecheck`
  - Run `pnpm test`
  - Run `pnpm lint`
  - Run `pnpm build`
  Verify: all validation and build commands exit cleanly with code 0.
