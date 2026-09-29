## 1. Preserve card values on metadata-only edits

- [x] 1.1 Omit a rounded, unchanged `creditLimit` from metadata update payloads; verified the comparison uses the canonical value shown by the form.

## 2. Reconcile stored negative balances

- [x] 2.1 Accept a hydrated negative available-credit value when it parses to a canonical decimal; verified the form accepts serializable negatives and the input removes the sign on amount-digit edits.

## 3. Sync and validate specifications

- [x] 3.1 Sync both capability deltas to their main specs and run `openspec validate --specs`; both deltas are present in the main specs and validation passes.
