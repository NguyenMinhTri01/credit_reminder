## Context

See `proposal.md` for motivation. The frontend form currently creates local-midnight `Date` values
and then calls `toISOString().slice(0, 10)`. On UTC+ hosts, UTC serialization moves local midnight
to the previous calendar day. GitHub Actions runs in UTC, so the existing test observes a different
date from a developer machine in `Asia/Ho_Chi_Minh`.

The backend already defines the default application time zone as `Asia/Ho_Chi_Minh` and performs
date-only arithmetic from explicit calendar parts. The frontend preview must preserve the same
date-only semantics without introducing an API request for every form change.

## Goals / Non-Goals

**Goals:**

- Make the preview deterministic across operating-system time zones.
- Preserve the intended calendar day when formatting the preview.
- Exercise the corrected behavior through the same coverage command used by `frontend-check`.

**Non-Goals:**

- Change the backend scheduling API or database schema.
- Change GitHub Actions job dependencies or bypass `ci-gate`.
- Extract a cross-package date library as part of this focused fix.

## Decisions

### D1: Perform date-only arithmetic with explicit calendar parts

The preview will derive today's year, month, and day in the application time zone, use UTC-backed
`Date` values only as an arithmetic container, and serialize the resulting parts directly as
`YYYY-MM-DD`.

This avoids converting a local-midnight instant to UTC. Merely changing the test expectation or
forcing a process-wide test time zone was rejected because either option would preserve the
production off-by-one bug.

### D2: Keep the application time zone explicit and testable

The frontend will define the same default application time zone used by the backend and allow the
preview helper to receive a clock/time-zone input internally. Component callers will use defaults;
tests will use a fixed instant.

Relying on the browser or runner's local time zone was rejected because it makes preview behavior
depend on deployment environment rather than product configuration.

### D3: Leave `ci-gate` unchanged

The gate correctly reported backend success and frontend failure, then exited non-zero. Fixing the
upstream frontend test makes the gate pass naturally and preserves its protection against future
failures.

## Risks / Trade-offs

- **[Risk] Frontend and backend scheduling helpers can drift** → Keep this patch limited to
  date-only serialization and cover its contract with explicit examples; consider a shared package
  only if future schedule logic changes require broader synchronization.
- **[Risk] The fixed test could still pass only in one environment** → Run frontend coverage with
  `TZ=UTC` and the normal local environment before completing the change.
