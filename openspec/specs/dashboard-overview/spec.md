# Dashboard Overview Specification

## Purpose

Provide every signed-in user with a secure, readable overview of credit limits, current balances, managed cards, and upcoming payment reminders.

## Requirements

### Requirement: Protected dashboard access
The system SHALL provide dashboard data and UI only to users with a valid signed-in session, and every returned record MUST belong to that user.

#### Scenario: Signed-in user opens the dashboard
- **WHEN** a user with a valid session visits `/`
- **THEN** the system displays that user's personalized dashboard

#### Scenario: Anonymous user opens the dashboard
- **WHEN** a user without a valid session visits `/`
- **THEN** the system redirects the user to sign-in and preserves the return URL

#### Scenario: Dashboard API has no valid token
- **WHEN** a client calls the dashboard API without a valid bearer token
- **THEN** the system returns an unauthorized error and does not disclose dashboard data

#### Scenario: Data is isolated between users
- **WHEN** an authenticated user requests dashboard data
- **THEN** totals, cards, and reminders are calculated only from records belonging to that user's ID

### Requirement: API provides a consistent aggregate snapshot
The system SHALL provide a read-only API that returns the summary, card list, and upcoming reminder list required to render the dashboard in one response. The summary and card list exclude soft-deleted cards. Card entries include available credit (from the stored field), expiry status, and due-date information computed from statement day and grace period.

#### Scenario: Summary is calculated from non-deleted cards
- **WHEN** a user has active and soft-deleted credit cards
- **THEN** the response totals and card list include only non-deleted cards

#### Scenario: Card entry includes schedule and expiry fields
- **WHEN** a card has `statementDay`, `paymentDueDaysAfterStatement`, and expiry data
- **THEN** the card entry in the dashboard response includes `nextDueDate`, `daysUntilDue`, `statementDate`, and `expiryStatus`

#### Scenario: Summary is calculated when cards exist
- **WHEN** a user has one or more credit cards
- **THEN** the response contains card count, known total credit limit, current total balance, available credit, and utilization calculated from the same set of that user's cards

#### Scenario: No card data exists
- **WHEN** a user has no credit cards
- **THEN** all monetary totals and card count are zero, utilization is undefined, and the card list is empty

#### Scenario: Credit limit is not declared
- **WHEN** a card has no credit limit
- **THEN** that card's limit, available credit, and utilization remain undefined instead of producing division or misleading values

#### Scenario: Balance exceeds the credit limit
- **WHEN** a balance is greater than a known credit limit
- **THEN** the response preserves the negative available credit and utilization greater than 100 to reflect the financial data accurately

#### Scenario: Monetary values are represented precisely
- **WHEN** the API returns a monetary value
- **THEN** the value is represented as a decimal string in VND units so JSON transport does not lose precision

### Requirement: Dashboard presents the financial summary
The UI SHALL display total credit limit, total balance, utilization, and available credit in a clear visual hierarchy using Vietnamese currency and readable percentage formatting.

#### Scenario: Summary values render
- **WHEN** the dashboard snapshot loads successfully
- **THEN** the user sees total credit limit, total balance, available credit, utilization, and card count corresponding to the response

#### Scenario: Utilization cannot be calculated
- **WHEN** total credit limit is zero or no known limits exist
- **THEN** the UI shows an unavailable state instead of `NaN`, `Infinity`, or an inaccurate percentage

### Requirement: Dashboard presents the card list
The UI SHALL render every non-deleted card with one shared component containing the bank name and logo, card name, masked number (formatted as `•••• XXXX`), limit, available credit, utilization, next due date with urgency styling, and expiry warning badge when applicable.

#### Scenario: Card has complete data including new fields
- **WHEN** a card has a limit, available credit, last four digits, statement day, grace period, and expiry date
- **THEN** the card renders formatted values, a utilization progress bar, the number of days until the next due date with urgency styling, the bank logo, and expiry status

#### Scenario: Card has complete data
- **WHEN** a card has a limit, balance, last four digits, and due date
- **THEN** the card renders formatted values, a utilization progress bar, and the number of days until the next due date

#### Scenario: Card has optional data missing
- **WHEN** a card is missing its limit, last four digits, or schedule configuration
- **THEN** the UI shows an unavailable label for that field and still renders the remaining information

#### Scenario: Card is over its limit
- **WHEN** a card's utilization is greater than 100%
- **THEN** the label shows the actual value while the progress bar is clamped to the valid visual range and a warning state is shown

#### Scenario: No cards exist
- **WHEN** the response contains an empty card list
- **THEN** the card area shows a clear empty state with a working "Add card" button that navigates to `/cards`

#### Scenario: Card detail sheet actions have non-overlapping click targets
- **WHEN** a user opens the card detail sheet from the dashboard or cards list
- **THEN** the edit action button and sheet close button render with independent, non-overlapping click areas and accessible names across all viewport widths

### Requirement: Dashboard presents upcoming reminders
The system SHALL return and display at most five active reminders with trigger dates from the current date onward, ordered by the soonest date first.

#### Scenario: Upcoming reminders exist
- **WHEN** a user has active reminders in the future or on the current date
- **THEN** the dashboard displays at most five items in ascending date order with title, date, and amount when available

#### Scenario: No upcoming reminders exist
- **WHEN** a user has no matching active reminders
- **THEN** the reminder area shows an empty state and displays the “Create reminder” button as a UI-only control

#### Scenario: Reminder is excluded by the filter
- **WHEN** a reminder is inactive or has a trigger date before the current date
- **THEN** that reminder does not appear on the dashboard

### Requirement: Card due dates are calculated by calendar date
The system SHALL derive the next due date from `statementDay` and `paymentDueDaysAfterStatement` in the application time zone. The due date equals the effective statement close date plus the configured grace period in calendar days. When `paymentDueDaysAfterStatement` is not configured (legacy data), the system falls back to treating `dueDay` as a fixed day-in-month target. The system MUST find the nearest upcoming due date, including cycles whose statement closed in a prior month. The API returns both an ISO date (`YYYY-MM-DD`) and the number of calendar days remaining.

#### Scenario: Due date has not passed in the current cycle
- **WHEN** today is `2026-09-05`, `statementDay` is `20`, and `paymentDueDaysAfterStatement` is `20`
- **THEN** the statement close is `2026-08-20`, the next due date is `2026-09-09`, and `daysUntilDue` is `4`

#### Scenario: Due date has passed, advance to next cycle
- **WHEN** today is `2026-09-15`, `statementDay` is `20`, and `paymentDueDaysAfterStatement` is `20`
- **THEN** the next due date is `2026-10-10` (from the `2026-09-20` statement close)

#### Scenario: Due date has not passed in the current month
- **WHEN** `dueDay` is equal to or after the current date in the application time zone
- **THEN** the next due date is in the current month

#### Scenario: Due date has passed
- **WHEN** `dueDay` is before the current date in the application time zone
- **THEN** the next due date is in the following month

#### Scenario: Due day exceeds the target month's length
- **WHEN** `statementDay` is `31` and the target month is February (28 or 29 days)
- **THEN** the statement close date uses the last day of February

#### Scenario: Legacy card with dueDay only
- **WHEN** a card has `dueDay` but no `paymentDueDaysAfterStatement`
- **THEN** the system uses the existing fixed-day-in-month logic for backward compatibility

### Requirement: Dashboard has useful loading and error states
The UI SHALL keep the layout stable while loading and SHALL provide an error message with a retry action when the snapshot cannot be fetched.

#### Scenario: Snapshot is loading
- **WHEN** the dashboard request has not completed
- **THEN** the UI displays skeletons matching the main blocks without showing fake data

#### Scenario: Dashboard request fails
- **WHEN** the dashboard API returns an error or cannot be reached
- **THEN** the UI displays an understandable error message and allows the user to retry

#### Scenario: Retry succeeds
- **WHEN** the user retries and the next request succeeds
- **THEN** the error state is replaced with the latest dashboard data

### Requirement: Layout is responsive and accessible
The dashboard SHALL use the existing design system, font, and semantic color tokens; content and navigation MUST use semantic structure, focus states, and suitable accessible names on desktop and small screens.

#### Scenario: Desktop screen
- **WHEN** the viewport is wide enough
- **THEN** the dashboard displays a fixed sidebar, header, and a multi-column content grid following the reference hierarchy

#### Scenario: Small screen
- **WHEN** the viewport is too narrow for the sidebar and multi-column grid
- **THEN** navigation changes to a collapsible panel and content blocks stack in one column without horizontal page scrolling

#### Scenario: Keyboard navigation
- **WHEN** the user navigates controls with a keyboard
- **THEN** focus order is sensible, focus indicators are visible, and icon-only controls have accessible names

#### Scenario: Bilingual content
- **WHEN** the current locale is Vietnamese or English
- **THEN** all dashboard labels and system states use that locale's translations instead of hard-coded strings

### Requirement: Unimplemented actions have no side effects
The "Create reminder", search, and feature navigation controls without corresponding pages SHALL be presented as coming soon and MUST not send write requests or navigate to routes outside this change. The "Add card" button SHALL navigate to `/cards` or open the card creation flow. The "Cards" navigation item SHALL link to `/cards`.

#### Scenario: User activates "Add card"
- **WHEN** the user activates the "Add card" button on the dashboard
- **THEN** the user is navigated to the card creation flow on the `/cards` page

#### Scenario: User clicks "Cards" in the sidebar
- **WHEN** the user clicks the "Cards" navigation item
- **THEN** the user is navigated to `/cards` and the navigation item shows as active

#### Scenario: User activates an unimplemented CTA
- **WHEN** the user activates "Create reminder"
- **THEN** no form, mutation, new data, or out-of-scope navigation is performed

#### Scenario: User encounters an unimplemented shell feature
- **WHEN** the user interacts with search or a navigation item without a page
- **THEN** the control clearly communicates that it is unavailable and does not create a route error or API request
