## Context

The backend stores credit cards in PostgreSQL through Prisma and maps rows to response interfaces in both the credit-card and dashboard services. Create/update DTOs use NestJS validation and Swagger decorators. The frontend has separate card-list, detail, and dashboard card components, uses React Hook Form with Zod, and already serves the five requested SVG files from `frontend/public/images/card-types/`. See `proposal.md` for the motivation and the delta specs for the observable contract.

## Goals / Non-Goals

**Goals:**

- Persist a nullable card type for backward compatibility while requiring and validating it on new-card creation.
- Keep the supported values and frontend presentation mapping centralized.
- Propagate the field through all card API and dashboard paths without changing financial calculations or ownership behavior.
- Reuse the existing SVG assets through a compact, accessible, failure-tolerant component.
- Show the matching card-type logo in the form selector trigger and options, consistent with bank selection.
- Cover API boundary validation, persistence/mapping, forms, rendering, and legacy records with focused tests.

**Non-Goals:**

- Adding card types beyond the five specified values.
- Creating a new card-type API/catalog endpoint or modifying bank catalog behavior.
- Changing transaction, credit-limit, schedule, expiry, authentication, or soft-delete semantics.
- Editing the supplied SVG file contents or adding a new image dependency.

## Decisions

1. **Use a nullable PostgreSQL/Prisma enum column.**
   - Add `CardType` with the exact uppercase values and `cardType CardType?` to `CreditCard`.
   - A nullable column lets existing rows migrate without synthetic values and keeps reads, updates, dashboard aggregation, and restore operations compatible.
   - A database enum is preferred over free-form text because it enforces the same closed set below the API boundary. The API still validates DTOs so clients receive normal field-level errors before persistence.
   - The alternative of a non-null column with a guessed default was rejected because a legacy card's network cannot be inferred safely.

2. **Validate create and update at the DTO boundary with the generated enum.**
   - `CreateCreditCardDto.cardType` is required and uses `@IsEnum(CardType)` plus an explicit Swagger enum declaration.
   - `UpdateCreditCardDto.cardType` is optional for partial updates but validates whenever supplied, including rejecting null where the field is being updated.
   - Service-level mapping passes the validated value through and returns the stored value; no separate service-only list of acceptable values is introduced.

3. **Expose one stable card-type registry in the frontend.**
   - Define a frontend `CardType` union and an ordered `CARD_TYPE_OPTIONS` constant containing the value, translation key, and public logo path for exactly the five supported types.
   - Keep human-readable labels in the existing English/Vietnamese message files and keep validation text there as well. Components consume the registry and translations rather than duplicating labels or paths.
   - The frontend payload interfaces and form values include `cardType`; create form validation requires it, while edit validation allows a missing value only for a legacy record and still validates any selected value.
   - The card-type selector renders `CardTypeLogo` for the selected value in its trigger and for each supported option, following the compact visual pattern used by the bank selector.

4. **Centralize branding in `CardTypeLogo`.**
   - The component resolves a runtime value through `CARD_TYPE_OPTIONS`, renders the matching SVG with a small design-system-compatible box (approximately 32×20) and `object-contain`, and supplies an accessible label.
   - Missing/unknown values and image-load failures render a compact generic credit-card fallback plus an unavailable label. This defensive runtime check protects legacy or stale API data even though typed application code uses the union.
   - Card tiles, dashboard tiles, the detail header, and the card-type selector render the same component and a translated type label. Any future card selector can consume the same registry/component.

5. **Keep dashboard and card response mapping explicit.**
   - Select `cardType` in the dashboard query and include it in `IDashboardCard` mapping.
   - Include it in `ICreditCard`, the response DTO, and the credit-card service mapper, preserving `null` for legacy rows.
   - Do not derive or infer a type from bank code, card number, or existing assets.

## Risks / Trade-offs

- **[Risk] Existing databases may be managed with `prisma migrate deploy` and contain legacy rows.** → Use an additive enum-and-nullable-column migration, verify it against the existing schema, and keep the rollback limited to the new column/type.
- **[Risk] A database enum can reject values from an older/newer application during mixed-version deployment.** → Deploy the additive migration before the application that sends card types; the nullable field keeps old application writes valid during the transition.
- **[Risk] Next image loading can fail for a missing asset or stale type.** → Handle image errors in `CardTypeLogo` and render the generic fallback without throwing or changing layout dimensions.
- **[Risk] Adding a required form control can invalidate existing test fixtures and edit forms for legacy cards.** → Supply an empty legacy edit value, allow metadata-only legacy edits, and add explicit create-without-type and legacy-render tests.

## Migration Plan

1. Add the Prisma `CardType` enum and nullable `card_type` column in a new timestamped migration; run Prisma client generation.
2. Deploy the migration before the application version that requires `cardType` on create.
3. Deploy backend and frontend changes. Existing rows retain `NULL`, remain readable, and show the fallback until edited.
4. Roll back application code independently if needed; if the schema itself must be rolled back, remove only the new nullable column and enum after no deployed code reads it. No existing card data is rewritten.
