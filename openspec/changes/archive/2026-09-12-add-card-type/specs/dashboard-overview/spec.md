## ADDED Requirements

### Requirement: Card type branding is displayed consistently

The card list, card detail view, dashboard card, and any card selector that displays card information SHALL show the card type label and its matching logo when `cardType` is known. The logo SHALL remain compact, preserve its aspect ratio, expose an accessible label, and use a safe fallback when the type is missing or cannot be resolved.

#### Scenario: Typed card displays the matching label and logo

- **WHEN** a card has any supported `cardType`
- **THEN** every in-scope card presentation shows the corresponding human-readable type label and matching card-type logo

#### Scenario: All supported types map to their own logos

- **WHEN** a card presentation receives `VISA`, `MASTERCARD`, `AMERICAN_EXPRESS`, `JCB`, or `NAPAS`
- **THEN** it renders the logo asset associated with that exact type and does not substitute another type's logo

#### Scenario: Legacy or unknown type uses a safe fallback

- **WHEN** a card has no card type or an unrecognized card type
- **THEN** the presentation shows an unavailable/fallback label and generic compact visual without throwing an error or breaking its layout

#### Scenario: Card form exposes only supported types

- **WHEN** a user creates or edits a card
- **THEN** the form provides a select control containing exactly the five supported types, requires a selection for creation, and displays a clear validation message when creation is submitted without one

#### Scenario: Card type selector displays matching logos

- **WHEN** a user opens the card-type select or chooses a supported card type
- **THEN** each option and the selected trigger display the matching compact card-type logo without changing the available options or their order
