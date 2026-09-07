## Why

The credit-card form due-date preview currently converts a local calendar date through
`toISOString()`, which shifts the displayed date on UTC+ time zones and makes the frontend test
pass locally but fail on the UTC GitHub Actions runner. This is one of the failures blocking
`frontend-check` and the dependent `ci-gate` on PR #5.

Note: `frontend-check` also fails due to pre-existing coverage threshold gaps (from the
credit-card-management change) that are out of scope here. A separate change is needed to
raise frontend coverage to 90%.

## What Changes

- Make the card-form due-date preview produce a stable `YYYY-MM-DD` calendar date without an
  environment-dependent UTC conversion.
- Correct the preview test expectations to the actual statement-day plus grace-period result.
- Verify the frontend coverage workflow in a UTC environment and run the complete CI-equivalent
  command set locally.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `credit-card-schedule`: Require the card-form due-date preview to remain the same across runtime
  host time zones and to preserve the intended calendar day.

## Impact

- Affected implementation: `frontend/src/components/cards/card-form.tsx` and the frontend shared
  constants used to define the application time zone.
- Affected tests: `frontend/src/components/cards/card-form.test.tsx`.
- No API, database, dependency, or migration changes.
- `ci-gate` requires no direct change because it correctly propagates the failed frontend result.
