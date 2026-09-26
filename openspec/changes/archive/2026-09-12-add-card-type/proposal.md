## Why

Credit cards currently have no issuer/network type, so users cannot distinguish cards with the same bank or see the appropriate network branding. Adding a controlled card type improves card entry accuracy and makes card information consistent across management and dashboard views while preserving legacy cards that do not have this data.

## What Changes

- Add a nullable persisted `cardType` field to credit cards with the supported values `VISA`, `MASTERCARD`, `AMERICAN_EXPRESS`, `JCB`, and `NAPAS`.
- Require `cardType` when creating a card and validate it at the API boundary; support optional card-type updates.
- Return `cardType` in card and dashboard payloads and document the field and supported values in Swagger.
- Add a safe database migration that does not invalidate existing cards; legacy records without a type remain usable and render a fallback.
- Add a shared frontend card-type registry, labels, and logo mapping using the existing SVG assets.
- Add a card-type dropdown and validation to create and edit forms.
- Show the matching card-type logo in the select trigger and options, using the same compact branding component as bank selection.
- Show the card type and compact, accessible card-type logo in every card presentation, including the cards list, card detail, dashboard cards, and related selectors.
- Add backend and frontend tests for valid and invalid types, required creation input, updates, logo mapping, and legacy-card fallback behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-crud`: Credit-card creation, updates, response data, validation, persistence, and legacy handling now include an optional persisted card type with a required value for new cards.
- `dashboard-overview`: Dashboard card entries and UI now include the card type and corresponding logo, with a safe fallback for legacy cards.

## Impact

- Backend Prisma schema, migration history, shared card types/constants, create/update/response DTOs, card service mapping, dashboard query mapping, Swagger metadata, and unit tests.
- Frontend shared types/constants/messages, card form and mutation payloads, shared card-type logo component, cards page/detail/dashboard card components, and component tests.
- No new runtime dependencies are required. Existing SVG files under `frontend/public/images/card-types/` are reused without modification.
