## ADDED Requirements

### Requirement: Card form due-date preview preserves calendar dates across host time zones
The card form SHALL calculate and display its due-date preview in the configured application time
zone. The displayed `YYYY-MM-DD` calendar date MUST remain identical when the same inputs and clock
instant are evaluated on hosts with different operating-system time zones.

#### Scenario: Preview is stable on local and CI hosts
- **WHEN** the clock is `2026-09-04T05:00:00Z`, the application time zone is
  `Asia/Ho_Chi_Minh`, `statementDay` is `5`, and `paymentDueDaysAfterStatement` is `15`
- **THEN** the preview displays `2026-09-20` on both an `Asia/Ho_Chi_Minh` development host and a
  UTC CI host

#### Scenario: Editing the statement day updates the stable preview
- **WHEN** the same form changes `statementDay` from `5` to `10`
- **THEN** the preview updates from `2026-09-20` to `2026-09-25` without shifting either date
  through UTC serialization
