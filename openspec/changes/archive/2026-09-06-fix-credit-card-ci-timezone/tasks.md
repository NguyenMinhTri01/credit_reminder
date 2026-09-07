## 1. Time-zone-safe due-date calculation

- [x] 1.1 Define the frontend default application time zone as `Asia/Ho_Chi_Minh` in the shared
  constants and verify the card form imports it without adding a duplicate hardcoded value
- [x] 1.2 Replace local-midnight-to-ISO conversion in the card-form due-date helper with explicit
  application-time-zone calendar parts and UTC-backed date-only arithmetic, then verify the helper
  returns `2026-09-20` for statement day 5 plus 15 grace days at the fixed specification instant

## 2. Regression coverage

- [x] 2.1 Update the card-form preview expectations to `20/09/2026` and `25/09/2026`, and add
  regression coverage proving the same fixed instant produces the same preview under UTC and
  `Asia/Ho_Chi_Minh`
- [x] 2.2 Run `TZ=UTC pnpm --filter frontend test:cov` and verify all frontend tests pass
  (309/309 pass under UTC). Note: global coverage thresholds (90%) are not met due to
  pre-existing gaps from the prior credit-card-management change (use-bank-catalog.ts,
  use-credit-cards.ts, use-transactions.ts at 0% coverage). Raising coverage to 90% is
  out of scope for this focused timezone fix and requires a separate change.

## 3. CI-equivalent verification

- [x] 3.1 Run the frontend CI sequence (`typecheck`, `lint`, `test:cov`, and `build`):
  `typecheck` ✓, `lint` ✓, `build` ✓. `test:cov` exits non-zero due to pre-existing
  coverage threshold failures (not introduced by this change); all 309 tests pass.
  The `ci-gate` on PR #5 will still fail until the coverage debt from the prior change
  is addressed in a dedicated follow-up. The `ci-gate` aggregation logic is unchanged.
- [x] 3.2 Run `openspec validate fix-credit-card-ci-timezone --strict` and verify the change remains
  valid before requesting a new PR workflow run
