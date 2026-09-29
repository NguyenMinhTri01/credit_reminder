## Context

See proposal.md for motivation. Edit forms round stored fractional cents for whole-đồng display, and reconciliation forms hydrate a stored negative available-credit balance into the same money input component.

## Goals / Non-Goals

**Goals:**
- Keep metadata-only card updates from sending a rounded `creditLimit` value back to the API.
- Allow an unchanged negative available-credit balance to pass reconciliation validation.

**Non-Goals:**
- Allow users to type a new negative amount into money inputs.
- Change how edits to the displayed credit-limit amount or reconciliation adjustment deltas are calculated.

## Decisions

- Compare the submitted credit limit with the canonical form of the stored value after applying the same display rounding. Include `creditLimit` in the update only when that displayed amount differs. Comparing with the raw stored decimal would treat the form's initial rounded value as a user edit.
- Reconciliation validation checks that the money input can be serialized, but does not reject a negative canonical value. The input cannot add a minus sign, and its existing edit behavior removes the sign when amount digits change, so a negative submission can only come from an unchanged hydrated balance.

## Risks / Trade-offs

- A displayed credit limit may differ from the stored cents; preserving it during metadata edits means users must change the displayed whole-đồng amount to submit a credit-limit update. This keeps metadata saves from changing the balance implicitly.
- Future changes to money-input sign editing could make the reconciliation form accept newly entered negatives; keep the input and validation behavior aligned with the spec.
