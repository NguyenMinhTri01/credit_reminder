## 1. Shared Skill Validator

- [x] 1.1 Implement `scripts/check-agent-skills.mjs` to inventory canonical and native skill
  directories, parse the required frontmatter subset, and verify the current repository reports all
  ten canonical skills.
- [x] 1.2 Enforce canonical naming, required metadata, native-only custom skill rejection, and
  unexpected collision rejection while allowing identifiable OpenSpec-generated adapters; verify
  each violation returns an actionable error and non-zero exit code.
- [x] 1.3 Add `node:test` coverage for valid inventories, malformed canonical skills, misplaced
  custom skills, unexpected collisions, and generated adapter exceptions, and verify the test file
  passes with Node.js 24.

## 2. Project Integration

- [x] 2.1 Add root `skills:check` and `skills:sync` package scripts, and verify `skills:check` runs
  tests plus read-only repository validation while `skills:sync` refreshes OpenSpec before invoking
  the same check.
- [x] 2.2 Run the validator against the existing inventory and resolve any native-only custom skill
  or unrecognized collision by moving project-authored content into `.agents/skills`; verify native
  skill directories contain only accepted generated adapters afterward.

## 3. Documentation

- [x] 3.1 Document `.agents/skills` ownership, complete-directory requirements, supported agent
  discovery and refresh behavior, native adapter exceptions, and maintenance commands in the root
  README; verify every supported agent and native directory is covered.
- [x] 3.2 Add the canonical skill ownership and validation rules to `AGENTS.md`, and verify future
  agents are instructed not to create manually maintained skills in tool-native directories.

## 4. Verification

- [x] 4.1 Run `pnpm skills:check` and verify all validator tests pass and the repository inventory is
  accepted without modifying files.
- [x] 4.2 Run `openspec validate centralize-agent-skills --strict` and relevant repository lint or
  formatting checks, then verify no unrelated files were changed.
