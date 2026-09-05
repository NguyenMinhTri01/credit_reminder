## Why

Project skills are currently spread across `.agents`, `.devin`, `.gemini`, and
`.opencode`, which makes ownership unclear and allows manually maintained skills to drift or be
shadowed by tool-specific copies. The supported agents can all discover project skills from
`.agents/skills`, so the project can establish one shared source while preserving native command
adapters where their formats differ.

## What Changes

- Establish `.agents/skills` as the canonical location for manually maintained project skills.
- Make shared skills available to Codex, Devin, Gemini CLI, and OpenCode through their supported
  `.agents/skills` discovery behavior instead of copying each shared skill into every tool folder.
- Keep tool-specific command and workflow files in their native directories.
- Preserve OpenSpec-generated tool-specific skill variants as managed adapters when their command
  syntax differs from the canonical skill.
- Add automated validation that detects misplaced custom skills, unexpected ID collisions, invalid
  skill structure, and missing canonical skills.
- Document the ownership, update, and verification workflow for shared and generated skills.

## Capabilities

### New Capabilities

- `shared-agent-skills`: Defines canonical skill ownership, discovery coverage, managed exceptions,
  and validation across the project's supported AI agents.

### Modified Capabilities

None.

## Impact

- Affects `.agents/skills`, tool-native AI configuration directories, root package scripts, project
  documentation, and a new validation utility and its tests.
- Does not change application runtime behavior, backend/frontend APIs, or production dependencies.
- OpenSpec updates remain responsible for generated OpenSpec adapters; project-authored skills are
  maintained only in the canonical directory.
