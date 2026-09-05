# Shared Agent Skills Specification

## Purpose

Provide one canonical project skill library that is consistently discoverable by every supported
AI coding agent while retaining only the native adapters required by individual tools.

## Requirements

### Requirement: Canonical shared skill library
The project SHALL treat `.agents/skills` as the canonical location for every manually maintained
project skill. A shared skill MUST include its complete directory, including `SKILL.md` and any
referenced scripts, assets, rules, or reference files.

#### Scenario: Add a shared project skill
- **WHEN** a maintainer adds a valid skill directory under `.agents/skills`
- **THEN** that directory becomes the single maintained definition of the skill for all supported
  agents

#### Scenario: Update a shared project skill
- **WHEN** a maintainer changes a canonical skill or one of its supporting files
- **THEN** no manually maintained copy in a tool-native skill directory is required

### Requirement: Supported agent discovery
Canonical skills SHALL be discoverable by Codex, Devin, Gemini CLI, and OpenCode from
`.agents/skills`. The project MUST document this supported agent set and the command each agent uses
to list, reload, or invoke skills when such a command exists.

#### Scenario: Agent starts in the repository
- **WHEN** a supported agent opens the project at or below the repository root
- **THEN** it can discover every valid canonical skill without a separate copied definition

#### Scenario: Skill inventory is refreshed
- **WHEN** a canonical skill changes during an active agent session
- **THEN** the maintainer can use the documented refresh mechanism or restart behavior for that
  agent to load the updated definition

### Requirement: Tool-native adapters remain isolated
Tool-specific commands, workflows, and OpenSpec-generated skill variants SHALL remain in the native
directories required by each tool. They MUST NOT become the canonical source for manually
maintained shared skills.

#### Scenario: Native command formats differ
- **WHEN** Gemini CLI, Devin, or OpenCode requires a distinct command or workflow format
- **THEN** the project retains that adapter in the tool's native directory while the underlying
  project-authored skills remain canonical under `.agents/skills`

#### Scenario: OpenSpec regenerates a native skill variant
- **WHEN** `openspec update` creates or refreshes a tool-specific skill with OpenSpec generation
  metadata
- **THEN** validation accepts the native variant as a managed exception and does not treat it as a
  manually maintained duplicate

### Requirement: Shared skill validation
The project SHALL provide a deterministic validation command that exits successfully only when the
shared skill layout follows the ownership policy. Validation MUST inspect complete skill
directories and MUST NOT modify files.

#### Scenario: Valid canonical inventory
- **WHEN** every canonical skill has a valid `SKILL.md`, its ID matches its directory name, and all
  native collisions are recognized generated adapters
- **THEN** the validation command exits successfully and reports the canonical skill count

#### Scenario: Custom skill exists only in a native directory
- **WHEN** a manually maintained skill exists under `.devin/skills`, `.gemini/skills`, or
  `.opencode/skills` without a canonical definition
- **THEN** validation fails and identifies the misplaced skill and expected canonical location

#### Scenario: Unexpected skill ID collision
- **WHEN** a native directory defines the same skill ID as a canonical skill without recognized
  generation metadata
- **THEN** validation fails and identifies both conflicting definitions

#### Scenario: Invalid canonical skill structure
- **WHEN** a canonical skill is missing `SKILL.md`, has invalid required frontmatter, or has a name
  that does not match its directory
- **THEN** validation fails with an actionable path and reason

### Requirement: Repeatable maintenance workflow
The project SHALL expose root package scripts for read-only validation and for synchronizing
OpenSpec-managed adapters before validation. It SHALL document when each command is appropriate.

#### Scenario: OpenSpec is upgraded
- **WHEN** a maintainer updates the OpenSpec CLI or refreshes generated integrations
- **THEN** the root synchronization command runs `openspec update` before shared skill validation

#### Scenario: CI or local verification runs
- **WHEN** the root shared-skill check script is executed
- **THEN** it performs the same read-only validation locally and in automation without requiring
  an installed AI agent

#### Scenario: Shared skill content changes
- **WHEN** a maintainer edits only a canonical project-authored skill
- **THEN** the maintainer can run the read-only check without regenerating native adapters
