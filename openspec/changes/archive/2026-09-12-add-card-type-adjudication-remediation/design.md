## Context

See `proposal.md` for the motivation. The current implementation already persists the five supported card types and maps nullable legacy values into card responses. The frontend `CardTypeLogo` component receives a default size of 32 and compact callers pass 20, but fixed `h-5 w-8` classes currently determine both render paths. The backend create DTO uses class-validator 0.14.x with separate `@IsNotEmpty` and `@IsEnum` decorators, so an omitted value can fail twice.

## Goals / Non-Goals

**Goals:**

- Make the live OpenSpec ownership and response wording agree with the existing card-type contract.
- Make logo dimensions follow the public `size` input while retaining the default 32×20 layout and a bounded fallback icon.
- Return one accurate card-type validation message for each invalid input class and preserve the existing supported enum values and HTTP rejection behavior.
- Add focused regression coverage for compact/default logo sizing and card-type validation messages.

**Non-Goals:**

- No edits to archived OpenSpec artifacts, bank SVGs, database schema, migrations, endpoints, or dependencies.
- No changes to the card-type enum, labels, option ordering, persistence mapping, or frontend form behavior beyond the specified sizing correction.

## Decisions

1. **Use current-spec deltas for contract corrections.** Copy the complete affected requirement blocks into the `credit-card-crud` and `dashboard-overview` deltas. Make `cardType` explicit in create/update wording, require `cardType: null` for legacy responses, and transfer the two selector scenarios to CRUD without changing their WHEN/THEN text. This keeps archived history immutable and prevents capability ownership from being duplicated.

2. **Apply computed dimensions directly to both logo render paths.** Derive height from the existing 5:8 aspect ratio, remove fixed outer size utilities, and apply the computed width and height to the image and fallback wrapper. Set the fallback icon to no larger than the computed height so a 20×13 fallback remains inside its box. Using computed inline dimensions is preferred over adding size-specific utility classes because the prop accepts arbitrary numbers and the default remains unchanged.

3. **Use one enum validator with a value-aware message callback.** Keep `@IsEnum(CardType)` as the single source of supported values and select `CARD_TYPE_REQUIRED` only for `undefined`, `null`, or an empty string; all other invalid values use `CARD_TYPE_INVALID`. This avoids duplicate constraints while preserving distinct client-facing messages. A custom validator or global `stopAtFirstError` would add behavior outside this field and is not needed.

4. **Assert the observable contracts at the focused test boundaries.** Extend the logo tests to inspect both CSS dimensions and default behavior for known and fallback paths. Extend DTO tests to assert one `isEnum` constraint and the exact required/invalid message for missing, empty, null, unsupported, and supported values.

## Risks / Trade-offs

- [Risk] Inline dimensions could regress the default visual layout → Mitigate with an explicit 32×20 default assertion and existing logo mapping tests.
- [Risk] A fallback icon could overflow the compact 20×13 box → Mitigate by deriving its square size from the computed height and asserting the fallback wrapper and icon dimensions.
- [Risk] Class-validator message callbacks could classify an unexpected empty representation incorrectly → Mitigate with direct tests for undefined, null, empty string, unsupported values, and supported enum values.
- [Risk] Moving scenarios could leave dashboard and CRUD specifications inconsistent → Mitigate by validating both deltas strictly and checking that each selector scenario appears exactly once in the resulting main-spec ownership.

## Migration Plan

No data migration is required. Deploy the source and test changes together with the live-spec corrections; legacy records continue to serialize `cardType: null`. If rollback is required, revert the source changes and the active change artifacts; no database or external state needs restoration.
