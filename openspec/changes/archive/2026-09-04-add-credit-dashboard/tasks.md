## 1. Backend contract and shared calculations

- [x] 1.1 Declare response types for `DashboardSnapshot`, summary, card, and reminder in backend shared types; verify TypeScript compilation and full Swagger descriptions for nullable and decimal-string fields.
- [x] 1.2 Implement pure date utilities for `nextDueDate` / `daysUntilDue` using default `APP_TIME_ZONE=Asia/Ho_Chi_Minh`, covering missing due days, past dates, month-end, February, and year wrap; verify unit test suite passes.
- [x] 1.3 Implement monetary aggregation utilities using Prisma `Decimal` for null/zero limits, negative or over-limit balances, `hasUnknownLimits`, and two-decimal serialization; verify unit tests avoid JavaScript floating-point in business calculations.

## 2. Read-only dashboard API

- [x] 2.1 Create `DashboardService` querying cards and up to five upcoming reminders in parallel by `userId`, selecting minimal fields, ordering stably, and mapping to contract; verify service tests cover happy path, empty user data, cross-user filtering, inactive/expired reminders, and five-item limit.
- [x] 2.2 Create `DashboardController` with `GET /dashboard`, JWT guard, and user ID derived strictly from the authenticated request; verify controller tests return service payloads and disallow client-supplied user contexts.
- [x] 2.3 Create `DashboardModule`, register it in `AppModule`, and add Swagger operation, response, and error metadata; verify module tests and Swagger documentation generation pass.
- [x] 2.4 Add e2e coverage for `GET /api/v1/dashboard`, including 401 on missing token and per-user data isolation with test fixtures; verify e2e suite passes without modifying Prisma schema.

## 3. shadcn foundation and frontend contract

- [x] 3.1 Run `shadcn info`, consult official documentation, and verify with `add --dry-run` / `--diff` for `sidebar`, `progress`, `empty`, `skeleton`, `dropdown-menu`, `input-group`, and dependencies; add only missing primitives without overwriting local components.
- [x] 3.2 Review source code of added registry components for Radix base and shadcn rules (group composition, accessible titles, icon APIs, semantic tokens, `gap-*`); verify frontend lint and typecheck pass after fixing imports/violations.
- [x] 3.3 Declare typed frontend `DashboardSnapshot`, extend server-side API client for `cache: 'no-store'`, and add formatter/view-model helpers for VND, dates, percentages, masking, nulls, and progress clamping; verify unit tests cover standard, missing-limit, and over-limit data.
- [x] 3.4 Add all dashboard, navigation, and state message keys to both `vi.json` and `en.json`; verify i18n parity test passes and components do not hardcode visible user strings.

## 4. Authenticated application shell

- [x] 4.1 Create authenticated route group and layout retaining the `/home` URL, wrapping content with shadcn `SidebarProvider` and `SidebarInset`; verify proxy redirect and existing `/home` route tests pass.
- [x] 4.2 Create centralized navigation config and `AppSidebar` with active Dashboard and aria-disabled / "Coming soon" state for unrouted features; verify desktop and mobile share identical item lists without duplicated markup or 404 links.
- [x] 4.3 Create `AppHeader` from `InputGroup`, `Avatar` with fallback, and `DropdownMenu` with proper group composition; ensure disabled search has accessible description, account menu uses session data, and keyboard/accessibility roles are verified by tests.
- [x] 4.4 Create responsive `AppShell` for desktop, tablet, and mobile without horizontal page overflow, preserving the shell across child loading and error states; verify responsive classes/landmarks tests pass alongside manual breakpoint checks.

## 5. Dashboard presentation components

- [x] 5.1 Create reusable `SummaryCard` and `SummaryGrid` using shadcn `Card` composition and `Progress`; verify tests assert KPI rendering, unknown-limit indicators, null percentages, and over-limit states from typed props.
- [x] 5.2 Create centralized `CreditCardTile` and `CreditCardGrid` with semantic variants, `Badge`, `Progress`, and shared formatters; verify tests cover full data, optional fields, due dates, masked numbers, over-limit states, and empty lists without duplicate card markup.
- [x] 5.3 Create `UpcomingReminders` using `Card`, `Separator`, and shadcn `Empty`; verify tests render correct ordering, maximum five items, nullable amounts, and empty states.
- [x] 5.4 Position "Add card", "Create reminder", search, and unrouted navigation items in disabled / aria-disabled states with "Coming soon" labels; verify interaction tests assert no unintended navigation, mutation requests, dialogs, or forms.
- [x] 5.5 Compose `DashboardView` with section headers, aligned CTAs, and responsive grid following reference hierarchy; verify component tests require a single snapshot payload without child section requests.

## 6. Data loading and UI states

- [x] 6.1 Replace placeholder `/home/page.tsx` with async Server Component calling `GET /dashboard` once via server-side API client and passing typed snapshot to `DashboardView`; verify page tests assert server-side bearer token, `no-store`, and successful data rendering.
- [x] 6.2 Create `home/loading.tsx` with reusable `DashboardSkeleton` using shadcn `Skeleton` matching section dimensions; verify tests assert no fake data rendering and placeholder layout covers summary, cards, and reminders.
- [x] 6.3 Create `home/error.tsx` client error boundary with shadcn `Alert` and retry `Button`; verify tests assert localized error message, invocation of `reset()` on retry, and shell retention.
- [x] 6.4 Manually verify with populated cards/reminders, empty data, and simulated API errors that dashboard displays no `NaN` or `Infinity`, does not leak cross-user data, and exposes no bearer tokens in logs or DOM.

## 7. Quality and audit

- [x] 7.1 Audit UI against shadcn rules: no custom alternatives to existing primitives, no raw hex/rgb in components, no manual dark overrides, no `space-x/y`, proper button icon APIs, and correct composition for Card, Avatar, Menu, and Empty; verify via code review and frontend lint.
- [x] 7.2 Verify light/dark semantic tokens, contrast, keyboard focus, screen reader names, and reduced motion; verify manually on mobile, tablet, and desktop, documenting findings in checklist.
- [x] 7.3 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, coverage, and `pnpm build`; resolve any issues and verify backend and frontend maintain the global 90% coverage threshold.
