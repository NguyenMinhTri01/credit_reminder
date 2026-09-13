## MODIFIED Requirements

### Requirement: Card type selection in card forms is accessible and consistent
The card form SHALL provide a select control containing exactly the five supported card types, require a selection when creating a card, and display a matching compact logo in each option and the selected trigger while preserving the option order and accessible labels. When the current card type is missing or unrecognized, the trigger SHALL display a generic compact card-type visual and an unavailable label.

#### Scenario: Card form exposes only supported types
- **WHEN** a user creates or edits a card
- **THEN** the form provides a select control containing exactly the five supported types, requires a selection for creation, and displays a clear validation message when creation is submitted without one

#### Scenario: Card type selector displays matching logos
- **WHEN** a user opens the card-type select or chooses a supported card type
- **THEN** each option and the selected trigger display the matching compact card-type logo without changing the available options or their order

#### Scenario: Legacy card type trigger uses a safe fallback
- **WHEN** a user edits a card whose `cardType` is `null` or unrecognized and no supported type is selected
- **THEN** the card-type trigger displays a generic compact card-type visual and the unavailable label without breaking the form layout
