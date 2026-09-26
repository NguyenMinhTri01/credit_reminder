## Why

The live card specifications do not consistently describe the card-type contract that the shipped API and UI already implement. In addition, compact card-type logos ignore their requested size and omitted card types produce duplicate, inaccurate validation messages. This remediation resolves the accepted review findings without changing supported values, persistence, API endpoints, archived history, or image assets.

## What Changes

- Clarify the `credit-card-crud` contract so `cardType` is listed as required for creation, optional for metadata updates, and explicitly returned as `null` for legacy cards.
- Move the two card-form card-type selector scenarios from `dashboard-overview` to `credit-card-crud` without changing their observable behavior.
- Make `CardTypeLogo` honor its `size` prop for both known-logo and fallback render paths, retaining the default 32×20 layout and adding compact-size regression coverage.
- Consolidate create-card `cardType` validation into one enum constraint that emits one accurate required or unsupported-value message, with coverage for missing, empty, null, invalid, and supported values.
- Do not edit the archived card-type change, bank SVG assets, or the supported card-type set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-crud`: Clarify create/update card-type fields and legacy response shape, and own the card-form selector scenarios.
- `dashboard-overview`: Remove the card-form selector scenarios that belong to credit-card CRUD while retaining dashboard card branding scenarios.

## Impact

- OpenSpec live specifications under `openspec/specs/credit-card-crud/` and `openspec/specs/dashboard-overview/`.
- Frontend card-type logo component and focused component/card-form tests.
- Backend create-credit-card DTO and focused DTO tests.
- No new dependencies, database migrations, endpoints, enum values, or asset changes.
