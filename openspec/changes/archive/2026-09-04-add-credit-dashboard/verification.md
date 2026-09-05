# Verification notes

Verified on 2026-09-04 against the `add-credit-dashboard` change.

## Automated checks

- Backend dashboard unit/controller/module/Swagger tests: passed (16 tests).
- Backend e2e: passed for missing JWT (`401`) and cross-user isolation.
- Full backend tests: passed (13 suites, 68 tests).
- Full frontend tests: passed (53 suites, 268 tests).
- Coverage: backend 100% statements/lines/functions and 95.08% branches; frontend 97.22% statements, 99.57% lines, 96.5% functions and 92.4% branches.
- `pnpm lint`, `pnpm typecheck`, backend build and frontend production build: passed. Lint retains four unrelated pre-existing auth warnings and has no errors.

## Manual browser checklist

- [x] Desktop 1440×1000: expanded sidebar is 256px, collapsed rail is 48px, content starts after the rail, and document width equals viewport width.
- [x] Tablet 768×900: summary and empty-state layouts remain readable with no horizontal overflow.
- [x] Mobile 390×844: single-column dashboard has no horizontal overflow; the shared navigation opens as a modal drawer and closes with Escape.
- [x] Light and dark semantic tokens: page, card, text, border, progress and sidebar colors remain coherent and readable.
- [x] Keyboard and screen reader: one `main` landmark; named navigation, sidebar trigger, search, account button, regions and progress bars; first keyboard target exposes a visible focus ring.
- [x] Reduced motion: with `prefers-reduced-motion: reduce`, sidebar and sheet transitions resolve to `transition-property: none`/no animation.
- [x] Present data: six cards, summary totals, clamped progress, masked numbers and due labels render without `NaN` or `Infinity`.
- [x] Empty data: zero-value summary and shadcn Empty states render for both cards and reminders; add/create controls remain disabled and labeled “Sắp ra mắt”.
- [x] API error: localized shadcn Alert and “Thử lại” action render inside the persistent application shell.
- [x] Security: the dashboard endpoint derives scope only from the authenticated JWT user; the browser DOM contains no bearer token, and the accessibility snapshot contains no data from another user.
- [x] Console: no runtime errors during successful/empty-state rendering; the only observed error was the intentionally injected HTTP 500 used to verify the error boundary.

## shadcn audit

- Dashboard and shell composition use shadcn Card, Progress, Badge, Empty, Skeleton, Sidebar, InputGroup, Avatar, DropdownMenu, Alert and Button primitives.
- No raw hex/rgb values, manual dark overrides, `space-x/y`, duplicated native controls or custom z-index values exist in dashboard/shell application components.
- Shared `SummaryCard`, `CreditCardTile`, navigation config and formatting helpers keep repeated markup and business display rules centralized.
