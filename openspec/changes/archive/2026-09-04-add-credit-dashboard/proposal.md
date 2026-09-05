## Why

Users have credit card and reminder data in the system model, but lack an overview dashboard to quickly check credit limits, balances, utilization, and upcoming due dates. The new dashboard transforms this data into a clear, modern entry point consistent with the existing design system across desktop and small screens.

## What Changes

- Replace the placeholder post-login area with a protected dashboard inspired by the reference layout: application shell, navigation, financial summary metrics, card list, and upcoming reminders section.
- Provide a read-only backend API scoped to the authenticated user that returns a stable aggregate payload for the dashboard.
- Display total credit limit, total balance, available credit, utilization percentage, card count, card details, and upcoming reminders, with clear loading, empty, and error states.
- Build the interface using shadcn/ui and shared domain components; retain Geist typography, semantic color tokens, and existing light/dark theme system without duplicating markup or logic across sections.
- Add a responsive application shell: sidebar on desktop and collapsible navigation on small screens, with keyboard accessibility and accessible landmarks/labels.
- Position "Add card" and "Create reminder" buttons in the layout without wiring up behavior, forms, CRUD, or write APIs in this change.
- Add contract types, Vietnamese/English translations, and frontend/backend automated tests covering dashboard behavior.

## Capabilities

### New Capabilities

- `dashboard-overview`: Personalized post-login dashboard including a read-only aggregate API, financial summary metrics, credit card list, upcoming reminders, application shell, and UI states.

### Modified Capabilities

None.

## Impact

- Frontend: current post-login route (`/home`), protected layout, query hook/API client, shared types, i18n messages, reusable dashboard/navigation components, and required shadcn/ui primitives.
- Backend: new dashboard module/controller/service, JWT guard, DTO/response types, Prisma queries on `CreditCard` and `Reminder`, Swagger metadata, and unit/e2e tests.
- Database: no schema changes or migrations required; this change only reads existing models.
- Dependencies: prioritize official shadcn registry components; add only required primitives via the shadcn CLI without introducing UI libraries outside the current design system.
- Compatibility: no breaking API changes; the login flow continues to redirect authenticated users to `/home`.
