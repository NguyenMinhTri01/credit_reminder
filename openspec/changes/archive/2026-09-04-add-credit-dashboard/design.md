## Context

Refer to `proposal.md` for motivation. The project is a pnpm monorepo consisting of Next.js 16 App Router and NestJS 11 / Prisma 7. `/home` is currently a placeholder protected by middleware and serves as the redirect destination after authentication. Prisma already includes `CreditCard` and `Reminder` models, but the backend only registers `AuthModule`; there are no APIs for dashboard, cards, or reminders yet.

The frontend uses React Server Components, Auth.js, next-intl, Tailwind CSS v4, and shadcn/ui style `new-york`, base `radix`. The component registry currently includes `Card`, `Button`, `Alert`, `Avatar`, `Badge`, `Separator`, and several other primitives; it lacks `Sidebar`, `Progress`, `Empty`, `Skeleton`, `DropdownMenu`, and `InputGroup`. The theme uses Geist typography and semantic brown/cream/neutral tokens in `globals.css`, including tokens for light and dark modes.

Reference mockups guide layout hierarchy and visual density, rather than requiring pixel-perfect copying of vibrant gradient colors. Automated test behaviors are specified in `specs/dashboard-overview/spec.md`.

## Goals / Non-Goals

**Goals:**

- A single read request provides complete data for the entire dashboard without waterfalls across KPIs, cards, and reminders.
- Enforce JWT authentication and scope `userId` in all backend queries; do not accept user IDs from query params or request bodies.
- Decompose the shell, sections, domain cards, formatting, and state views into reusable abstractions ready for future Cards/Reminders feature pages.
- Server-render primary data via RSC, keeping client boundaries small for mobile sidebar drawers and account menus.
- Use official shadcn/ui components first, creating custom components only through composition and variants when primitives cannot express domain concepts.
- Maintain a clean, modern layout aligned with Geist and existing semantic tokens, functional in both light/dark themes, with basic accessibility compliance.

**Non-Goals:**

- No card or reminder creation, updates, or deletions; no forms and no mutation endpoints.
- No implementation of search functionality, or Cards, Reminders, History, or Settings pages and their navigation handlers.
- No historical charts, transaction sync, Gmail/Zalo integrations, theme switchers, or real-time polling.
- No Prisma schema alterations, production seed data, or payment processing logic.
- No direct copying of bright gradients or floating action buttons from reference images if they conflict with project design tokens.

## Decisions

### 1. Retain dashboard at `/home` and introduce protected application layout

`/home` remains the dashboard route because Auth.js and the proxy already redirect authenticated users here. Introduce a route group/layout for authenticated areas so that `AppShell` can be reused by future pages without duplicating headers and sidebars.

The shell includes:

- `AppSidebar`: Dashboard active; Cards, Reminders, History, and Settings displayed disabled with "coming soon" indicators.
- `AppHeader`: brand, disabled search input with "coming soon" label, avatar, and account menu utilizing existing session data.
- shadcn `SidebarProvider` / `SidebarInset` to provide a single navigation structure transitioning to mobile sheets without duplicate menus.

Renaming the route to `/dashboard` was rejected because it would disrupt existing redirect paths and create two URLs for the same capability without added value in this scope.

### 2. Single aggregate endpoint `GET /api/v1/dashboard`

Introduce `DashboardModule`, `DashboardController`, and `DashboardService`. The controller applies `AuthGuard('jwt')`, extracting `req.user.id` from the existing strategy and refusing client-supplied user IDs. The service executes two parallel queries selecting minimal fields:

1. All cards belonging to the user, ordered stably by `createdAt`, to produce both the card list and summary totals from the exact same dataset.
2. Up to five reminders belonging to the user where `isActive = true` and `nextTriggerDate >= today`, ordered by `nextTriggerDate ASC`, then `createdAt ASC` as a tiebreaker.

The two independent queries run in parallel. Separate endpoints for cards and reminders were rejected to prevent waterfalls and discrepancies between summary totals and rendered lists.

Response contract:

```ts
interface DashboardSnapshot {
  generatedAt: string
  summary: {
    cardCount: number
    totalCreditLimit: string
    totalCurrentBalance: string
    availableCredit: string
    utilizationPercent: number | null
    hasUnknownLimits: boolean
  }
  cards: Array<{
    id: string
    bankName: string
    cardName: string
    cardNumberMasked: string | null
    creditLimit: string | null
    currentBalance: string
    availableCredit: string | null
    utilizationPercent: number | null
    nextDueDate: string | null
    daysUntilDue: number | null
  }>
  upcomingReminders: Array<{
    id: string
    title: string
    amount: string | null
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME' | null
    nextTriggerDate: string
  }>
}
```

Monetary values are serialized to two-decimal numeric strings to avoid precision loss across Prisma `Decimal` and JSON serialization. The frontend only parses these values for display formatting, never for write logic.

Separate endpoints for summary, cards, and reminders were rejected due to request overhead and redundant auth checks. A GraphQL endpoint was rejected because the project uses REST and the dashboard requires no dynamic client queries.

### 3. Aggregation rules for undeclared credit limits

- `totalCreditLimit`: sum of non-null `creditLimit` values.
- `totalCurrentBalance`: sum of `currentBalance` across all cards.
- `availableCredit`: sum of `(creditLimit - currentBalance)` exclusively for cards with declared limits.
- `utilizationPercent`: `sum(currentBalance for cards with limits) / totalCreditLimit * 100`; returns `null` when total credit limit is zero.
- `hasUnknownLimits`: true when at least one card has a null limit, allowing the UI to explain that the limit KPI does not cover all cards.
- Real monetary and percentage values are not clamped. Only values passed to visual progress bars are clamped to `[0, 100]`; text labels reflect exact figures, and over-limit states use semantic destructive variants.

Treating null limits as zero was rejected because it produces misleading utilization rates. Dropping balances of cards lacking limits was rejected because it conceals actual payment obligations.

### 4. Centralized next due date calculation on the backend

A pure date utility accepts `dueDay`, current date, and application timezone. The timezone is derived from `APP_TIME_ZONE`, defaulting to `Asia/Ho_Chi_Minh`. The utility selects the current month if the due day has not passed, or rolls over to the next month; if the due day exceeds the days in that month, it clamps to the last day of the month. It returns an ISO date string `YYYY-MM-DD` and day difference in calendar days, not hours.

Backend calculation ensures consistent dates across all clients and simplifies unit testing for month/year boundaries. Browser-side calculation was rejected due to device timezone discrepancies.

### 5. Server-first data loading with App Router state files

`/home/page.tsx` is an async Server Component that calls `apiClient` server-side so Auth.js automatically attaches the access token and fetches the snapshot with `cache: 'no-store'`. `loading.tsx` renders `DashboardSkeleton`; `error.tsx` is a client error boundary rendering an `Alert` and retry action. This avoids managing dashboard orchestration inside a giant client component without requiring Zustand or TanStack Query state for navigation-bound read requests.

The only client islands are the shadcn Sidebar component needing responsive state and the account menu/logout. Snapshot data cascades down to presentational components via typed props.

Using `useAuth` and passing tokens to TanStack Query was rejected for this change because it introduces post-hydration loading flashes and expands the client component tree. If background refresh or mutations are required later, snapshots can be hydrated into Query cache without altering API contracts.

### 6. Component map prioritizing shadcn and composition

Missing primitives are installed via `pnpm dlx shadcn@latest add` after verification with `--dry-run` and `--diff`: `sidebar`, `progress`, `empty`, `skeleton`, `dropdown-menu`, `input-group`, and associated registry dependencies. Existing primitives are reused without re-adding or copying source code.

Expected domain and component structure:

```text
components/
├── layout/
│   ├── app-shell.tsx
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   └── account-menu.tsx
└── dashboard/
    ├── dashboard-view.tsx
    ├── summary-grid.tsx
    ├── summary-card.tsx
    ├── credit-card-grid.tsx
    ├── credit-card-tile.tsx
    ├── upcoming-reminders.tsx
    ├── dashboard-empty.tsx
    └── dashboard-skeleton.tsx
```

- `SummaryCard` accepts label, value, supporting text, icon, and status; all three KPIs share one component.
- `CreditCardTile` accepts a view model and semantic variant; all cards share uniform markup.
- `UpcomingReminders` manages both the list and the `Empty` state without splitting into separate sections.
- Navigation definitions and currency/date/percentage formatters reside in shared modules to avoid duplicate literals and logic.
- Full use of composition: `CardHeader/CardTitle/CardDescription/CardContent/CardFooter`, `AvatarFallback`, `DropdownMenuGroup`, `Empty`, `Skeleton`, `Progress`, `Badge`, `Separator`, and `Button`.
- `className` only dictates layout and responsive properties; colors and typography utilize variants or semantic tokens. No hardcoded colors from reference mockups, no `space-x/y`, and no custom progress/empty/badge implementations using raw `div`/`span`.

A monolithic dashboard component was rejected to preserve testability and modularity when adding future cards/reminders pages. Creating custom primitives instead of shadcn components was rejected to prevent design system fragmentation.

### 7. Visual hierarchy guided by reference layout with existing theme

- Desktop: full-width header, left sidebar, main content with max-width boundaries; three-column summary grid, up to three-column card grid, full-width reminders.
- Tablet: two-column summary and card grids; collapsed rail sidebar mode.
- Mobile: single column, mobile sidebar sheet, CTAs placed in section headers rather than floating to avoid covering content.
- Palette: `background`, `card`, `primary`, `secondary`, `muted`, `destructive`, `border`, `chart-*`, and sidebar tokens. Credit card variants use centralized semantic surface/tone styles without raw hex/rgb values in components.
- Typography: retain `Geist`; tabular numerals for monetary figures to keep KPIs visually stable.
- Animation: standard short transitions honoring `prefers-reduced-motion`; no decorative animations.

### 8. Out-of-scope controls clearly marked as unavailable

The two CTAs "Add card" and "Create reminder" are shadcn `Button` elements in a disabled state with accessible "Coming soon" screen reader labels. Search input and unimplemented navigation items are disabled/aria-disabled without empty handlers or broken 404 links. The Dashboard nav item is the sole active link.

Disabled state indicators were chosen over "coming soon" toast alerts because toasts demand click interactions for actions already acknowledged as non-functional.

### 9. Contract testing and component boundaries

- Backend service tests mock Prisma and cover Decimal aggregations, null/zero limits, over-limit balances, reminder filtering/sorting/limits, and due date boundaries.
- Controller tests verify JWT guard metadata, user ID extraction from requests, and passthrough of service payloads.
- Backend e2e tests cover 401 responses and per-user isolation with test database fixtures.
- Frontend formatter/view-model tests cover VND formatting, null handling, percentages, and progress clamping.
- Component and page tests use Testing Library for happy path, loading, empty states, error/retry, disabled actions, i18n parity, and accessible names.
- Responsive structures are verified via semantic roles and classes in automated tests alongside manual mobile/tablet/desktop checklists, avoiding fragile large HTML snapshots.
- Maintain global 90% test coverage thresholds while running lint, typecheck, unit tests, and builds across both workspaces.

## Risks / Trade-offs

- [Database schema has `dueDay` without user timezone] → Use centralized `APP_TIME_ZONE=Asia/Ho_Chi_Minh` and design date utilities to accept per-user timezones in the future.
- [Total credit limit does not reflect cards with null limits] → Return `hasUnknownLimits` flag and keep per-card limit fields null rather than coercing to 0.
- [Payload size risk if a user has many cards] → Select only necessary fields; pagination is omitted on the dashboard as personal card counts are typically small, with pagination planned once justified by real usage.
- [shadcn registry version drifts with local components] → Verify with `info`, `--dry-run`, and `--diff`; add only missing primitives without overwriting custom components.
- [Subdued UI may differ from colorful reference mockups] → Prioritize project color/font tokens; use mockups strictly for layout, spacing, and hierarchy.
- [RSC request errors could crash entire page into error boundary] → Shell resides in the authenticated layout, replacing only the dashboard content with an error alert and retry button.
- [Disabled CTAs might confuse users] → Provide clear "Coming soon" labels and tooltips, avoiding them as the sole focal point of empty states.

## Migration Plan

1. Add backend endpoints and tests first; new endpoints do not disrupt existing consumers.
2. Add shared frontend contracts/formatters and missing shadcn primitives after diff verification.
3. Add authenticated shell and dashboard presentation components, then replace `/home` placeholder.
4. Add localization keys and state boundaries; execute manual accessibility and responsive audits.
5. Execute full lint, typecheck, test coverage, and build suites before merging.

Rollback involves reverting the frontend route/layout and unregistering `DashboardModule`; no database migrations or data rollbacks are required. The new backend endpoint can safely remain during rollback without affecting legacy clients.
