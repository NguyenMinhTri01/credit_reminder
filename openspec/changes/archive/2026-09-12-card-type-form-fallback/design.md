## Context

See `proposal.md` for the motivation. The card form derives its selected card type by looking up the watched value in the supported option registry. Legacy responses may contain `cardType: null`, and stale data may contain an unrecognized value; both cases currently produce no trigger children, leaving only the select placeholder visible.

## Goals / Non-Goals

**Goals:**

- Keep the card-type selector usable and visually informative when an edit form represents a missing or unrecognized card type.
- Reuse the existing compact `CardTypeLogo` fallback and translation key so the trigger matches other card presentations.
- Preserve the placeholder for a new create form with no selection and preserve normal supported-type selection behavior.
- Update the adjudication plan as a completed historical record without machine-specific paths or stale implementation instructions.

**Non-Goals:**

- Do not add a new card type, API behavior, migration, dependency, or asset.
- Do not allow a legacy or unrecognized value to become a selectable option or silently submit it as a supported type.

## Decisions

1. **Render the fallback only for edit-mode missing values.** Use the existing `isEdit` state and the watched card-type value to distinguish a legacy edit from a new form awaiting its first selection. The edit trigger will render `CardTypeLogo` with a null value and the translated unavailable label; create mode will retain its current placeholder.

2. **Keep the supported lookup path unchanged.** When the watched value maps to a supported option, continue rendering the selected logo and translated label exactly as today. The fallback branch handles only values that have no supported option, so option order and selection semantics remain unchanged.

3. **Verify through the card-form integration boundary.** Add a focused test with edit-mode legacy defaults and assert both the generic logo role and unavailable label in the card-type trigger. Existing supported-option and validation tests remain the regression coverage for the normal path.

4. **Update the review plan as documentation, not a new contract.** Replace stale proposed/pending/not-run wording with the completed remediation status, record the archived change, and generalize the repository-root field. Keep the original adjudication decisions and historical archive references intact.

## Risks / Trade-offs

- [Risk] A fallback in edit mode could look like a selected value → Mitigate with the explicit unavailable label and the existing validation/selection behavior.
- [Risk] Rendering an extra fallback logo in create mode could make an unselected required field appear complete → Mitigate by gating the fallback on `isEdit`.
- [Risk] Editing the review plan could accidentally alter historical decisions → Limit the documentation patch to status, verification, handoff, and machine-specific metadata; do not change the decision summary or archived artifacts.

## Migration Plan

No data migration is required. The change is backward-compatible for legacy cards and can be rolled back by reverting the form, spec, and documentation edits.
