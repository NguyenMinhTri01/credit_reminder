## 1. Database and backend contract

- [x] 1.1 Add the `CardType` Prisma enum and nullable `CreditCard.cardType` field, then create a timestamped additive migration that preserves existing rows; verify with Prisma schema validation and generated-client success
- [x] 1.2 Add card-type values, labels/messages, and response/interface fields to the backend shared contract; verify all five values are represented exactly once and legacy response types permit `null`
- [x] 1.3 Update create/update DTOs with required/optional enum validation and Swagger metadata; add DTO tests for all five valid values, missing create input, invalid input, and invalid update input
- [x] 1.4 Propagate `cardType` through credit-card service create/update/read mapping and dashboard query mapping without changing existing financial behavior; add service/dashboard tests for persistence, update, response mapping, and legacy-null cards

## 2. Frontend card-type foundation

- [x] 2.1 Add the frontend `CardType` type, ordered five-option registry, translation labels, validation messages, and `cardType` fields to card and dashboard payload interfaces; verify typecheck and message parity for English and Vietnamese
- [x] 2.2 Implement the shared `CardTypeLogo` component with centralized mapping, compact aspect-ratio-preserving sizing, accessible labels, and missing/unknown/image-error fallback; add rendering tests for each supported type and fallback behavior
- [x] 2.3 Add a card-type select to the create/edit card form with exactly five options, required create validation, legacy-safe edit defaults, and correct payload serialization; update form/add/edit tests to cover selection, missing value, and edits
- [x] 2.4 Show the matching `CardTypeLogo` in the card-type select trigger and each option, consistent with bank selection; add regression tests for selected and available option logos

## 3. Card presentation integration

- [x] 3.1 Update cards-page tiles and card detail headers to render the shared logo and translated card-type label while preserving layout for legacy cards; add or update component tests for all supported types and fallback
- [x] 3.2 Update dashboard card tiles and any card selectors that render card information to show the same type label/logo mapping; add or update dashboard tests for typed and legacy cards

## 4. Verification

- [x] 4.1 Run targeted backend and frontend card-type tests, then run `pnpm lint`, `pnpm test`, and `pnpm build`; resolve failures without changing unrelated behavior
- [x] 4.2 Run `openspec validate add-card-type --type change --strict` and confirm all change tasks are complete with the migration, tests, and final file list ready for handoff
