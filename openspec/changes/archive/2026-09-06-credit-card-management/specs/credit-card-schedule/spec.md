## Purpose

Calculate payment due dates from statement-day and grace-period configuration per billing cycle, and warn users when their card approaches or passes its expiry date.

## ADDED Requirements

### Requirement: Due date is derived from statement day plus grace period
The system SHALL calculate the next payment due date by finding the most recent statement close date on or before today (using the card's `statementDay`), adding `paymentDueDaysAfterStatement` calendar days to that close date. If the resulting due date is in the past, the system advances to the next billing cycle. The system MUST check cycles whose statement closed in a prior month or even earlier when the grace period spans across months.

#### Scenario: Due date from a prior month's statement cycle
- **WHEN** today is `2026-09-05`, `statementDay` is `20`, and `paymentDueDaysAfterStatement` is `20`
- **THEN** the statement close date is `2026-08-20`, the due date is `2026-09-09`, and days until due is `4`

#### Scenario: Due date has already passed, advance to next cycle
- **WHEN** today is `2026-09-15`, `statementDay` is `20`, and `paymentDueDaysAfterStatement` is `20`
- **THEN** the statement close date `2026-08-20` produces due date `2026-09-09` which is past, so the system uses statement close `2026-09-20` producing due date `2026-10-10`, and days until due is `25`

#### Scenario: Statement day exceeds the month's length
- **WHEN** `statementDay` is `31` and the target month is February 2026 (28 days)
- **THEN** the statement close date uses February 28 and the due date is calculated from that date

#### Scenario: Due date falls on today
- **WHEN** the calculated due date equals today's date in the application time zone
- **THEN** days until due is `0` and the UI displays "Due today"

#### Scenario: Grace period spans a year boundary
- **WHEN** today is `2026-12-28`, `statementDay` is `15`, `paymentDueDaysAfterStatement` is `25`
- **THEN** the statement close date is `2026-12-15`, the due date is `2027-01-09`

### Requirement: Due date calculation uses the application time zone
The system SHALL determine "today" in the configured application time zone (`Asia/Ho_Chi_Minh` by default) for all date comparisons and day-count calculations.

#### Scenario: UTC and local time zone are on different calendar dates
- **WHEN** the server clock shows `2026-09-05T23:30:00Z` (which is `2026-09-06T06:30:00+07:00`)
- **THEN** today is `2026-09-06` and all due-date calculations use that date

### Requirement: Due date is returned as an ISO date with days remaining
The API SHALL return the computed due date as a `YYYY-MM-DD` string and an integer `daysUntilDue` representing the number of calendar days from today to the due date (inclusive of today as day 0).

#### Scenario: API response shape
- **WHEN** the system computes a due date for a card
- **THEN** the response includes `nextDueDate` (string, `YYYY-MM-DD`), `daysUntilDue` (integer), and the associated `statementDate` (string, `YYYY-MM-DD`)

### Requirement: Shared due-date logic between dashboard and cards page
The system SHALL use the same utility function for due-date calculation in both the dashboard API and the cards API so that results are always consistent.

#### Scenario: Dashboard and card detail show the same due date
- **WHEN** a user views their card on the dashboard and on the cards page simultaneously
- **THEN** both display the same next due date and days remaining

### Requirement: Legacy cards with only dueDay fall back to fixed-day calculation
The system SHALL support a fallback for cards that have `dueDay` but not `paymentDueDaysAfterStatement`. For these cards, `dueDay` is treated as a fixed day-in-month target (existing behavior) until the user configures the grace period.

#### Scenario: Legacy card with dueDay only
- **WHEN** a card has `dueDay` = `15` and no `paymentDueDaysAfterStatement`
- **THEN** the due date is the 15th of the current or next month using the existing fixed-day logic

### Requirement: Card expiry warning at three calendar months
The system SHALL warn users when their card is within three calendar months of expiry or has already expired. The card is valid through the last day of its expiry month/year.

#### Scenario: Card expiring in March 2030
- **WHEN** a card has `expiryMonth` = `3`, `expiryYear` = `2030`
- **THEN** the card is valid through `2030-03-31`, the warning starts from `2029-12-31`, and the card is expired from `2030-04-01`

#### Scenario: Today is within warning period
- **WHEN** today is between the warning start date (inclusive) and the expiry end date (inclusive)
- **THEN** the card displays a "expiring soon" warning badge

#### Scenario: Today is after expiry
- **WHEN** today is after the last day of the expiry month
- **THEN** the card displays an "expired" badge

#### Scenario: Card has no expiry data
- **WHEN** a card has no `expiryMonth` or `expiryYear`
- **THEN** no expiry warning or badge is shown and the field displays as unavailable

#### Scenario: Three-month subtraction on edge dates
- **WHEN** the expiry end date is `2030-03-31` and three calendar months are subtracted
- **THEN** the warning start date is `2029-12-31` (December has 31 days, so December 31 exists)

#### Scenario: Three-month subtraction creates a nonexistent date
- **WHEN** the expiry end date is `2026-05-31` and three calendar months are subtracted
- **THEN** the target is February 31 which does not exist, so the warning start date is `2026-02-28` (last day of February 2026)

### Requirement: Expiry warning is computed at data-load time
The system SHALL compute expiry status when data is loaded (page open or refresh), not in real time. No background timers, WebSocket, or push notifications are needed.

#### Scenario: Reload updates expiry status
- **WHEN** a user reloads the page on a day that crosses into the warning period
- **THEN** the expiry warning appears without requiring a server restart or background job

### Requirement: Expired cards remain fully visible
The system SHALL NOT hide, disable, or remove data from cards that have expired. Payment schedule, transactions, and all card details continue to display normally.

#### Scenario: Expired card on dashboard
- **WHEN** a card has expired
- **THEN** the dashboard still shows the card's available credit, utilization, and due date alongside the expired badge

### Requirement: Due-date urgency levels
The system SHALL apply visual urgency levels to due dates based on configurable day thresholds: overdue (past due), urgent (0–3 days), warning (4–7 days), and normal (> 7 days).

#### Scenario: Due date is today
- **WHEN** `daysUntilDue` is `0`
- **THEN** the UI displays "Due today" with urgent styling

#### Scenario: Due date in 3 days
- **WHEN** `daysUntilDue` is `3`
- **THEN** the UI displays the date with urgent styling

#### Scenario: Due date in 5 days
- **WHEN** `daysUntilDue` is `5`
- **THEN** the UI displays the date with warning styling

#### Scenario: Editing schedule updates the displayed due date
- **WHEN** a user changes `statementDay` or `paymentDueDaysAfterStatement` and saves
- **THEN** the cards page and dashboard display the recalculated due date immediately
