import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  formatAgentSkillReport,
  inspectAgentSkills,
  parseSkillFrontmatter
} from './check-agent-skills.mjs'

const SCRIPT_PATH = fileURLToPath(new URL('./check-agent-skills.mjs', import.meta.url))

async function createProject(t) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'agent-skills-'))

  t.after(async () => {
    await rm(projectRoot, { force: true, recursive: true })
  })

  return projectRoot
}

function createSkillContent(name, options = {}) {
  const description = options.description ?? 'A portable test skill.'
  const metadata = options.generated
    ? '\nmetadata:\n  author: openspec\n  generatedBy: "1.12.0"'
    : ''

  return `---\nname: ${name}\ndescription: ${description}${metadata}\n---\n\nInstructions.\n`
}

async function writeSkill(projectRoot, sourceDirectory, id, content) {
  const skillDirectory = join(projectRoot, sourceDirectory, id)

  await mkdir(skillDirectory, { recursive: true })
  await writeFile(join(skillDirectory, 'SKILL.md'), content, 'utf8')
}

test('accepts canonical skills and generated native adapters', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'openspec-skill',
    createSkillContent('openspec-skill')
  )
  await writeSkill(
    projectRoot,
    '.devin/skills',
    'openspec-skill',
    createSkillContent('openspec-skill', { generated: true })
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.deepEqual(report.errors, [])
  assert.equal(report.canonicalCount, 1)
  assert.equal(report.generatedAdapterCount, 1)
})

test('rejects a generated-metadata collision for non-openspec canonical skill', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'shared-skill',
    createSkillContent('shared-skill')
  )
  await writeSkill(
    projectRoot,
    '.devin/skills',
    'shared-skill',
    createSkillContent('shared-skill', { generated: true })
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.match(
    report.errors.join('\n'),
    /unexpected collision with \.agents\/skills\/shared-skill/
  )
})

test('rejects a generated native skill when matching canonical skill is missing', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'openspec-valid',
    createSkillContent('openspec-valid')
  )
  await writeSkill(
    projectRoot,
    '.devin/skills',
    'openspec-orphan',
    createSkillContent('openspec-orphan', { generated: true })
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.match(
    report.errors.join('\n'),
    /custom skill must move to \.agents\/skills\/openspec-orphan/
  )
})

test('reports malformed canonical skill frontmatter', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'Bad_ID',
    '---\nname: another-name\ndescription:\n---\n'
  )

  const report = await inspectAgentSkills(projectRoot)
  const output = formatAgentSkillReport(report)

  assert.match(output, /not a valid lowercase kebab-case skill ID/)
  assert.match(output, /must match directory "Bad_ID"/)
  assert.match(output, /required frontmatter field "description" is missing/)
})

test('rejects a custom skill that exists only in a native directory', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'shared-skill',
    createSkillContent('shared-skill')
  )
  await writeSkill(
    projectRoot,
    '.gemini/skills',
    'native-only',
    createSkillContent('native-only')
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.match(report.errors.join('\n'), /custom skill must move to \.agents\/skills\/native-only/)
})

test('rejects an unrecognized native collision', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'shared-skill',
    createSkillContent('shared-skill')
  )
  await writeSkill(
    projectRoot,
    '.opencode/skills',
    'shared-skill',
    createSkillContent('shared-skill')
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.match(report.errors.join('\n'), /unexpected collision with \.agents\/skills\/shared-skill/)
})

test('accepts generated adapters in every native skill directory', async (t) => {
  const projectRoot = await createProject(t)
  const nativeDirectories = ['.devin/skills', '.gemini/skills', '.opencode/skills']

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'openspec-skill',
    '---\nname: openspec-skill\ndescription: >\n  A folded skill description.\n---\n'
  )

  for (const nativeDirectory of nativeDirectories) {
    await writeSkill(
      projectRoot,
      nativeDirectory,
      'openspec-skill',
      createSkillContent('openspec-skill', { generated: true })
    )
  }

  const report = await inspectAgentSkills(projectRoot)

  assert.deepEqual(report.errors, [])
  assert.equal(report.generatedAdapterCount, 3)
})

test('returns a non-zero CLI status with actionable diagnostics', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'shared-skill',
    createSkillContent('shared-skill')
  )
  await writeSkill(
    projectRoot,
    '.devin/skills',
    'native-only',
    createSkillContent('native-only')
  )

  const result = spawnSync(process.execPath, [SCRIPT_PATH, projectRoot], {
    cwd: dirname(SCRIPT_PATH),
    encoding: 'utf8'
  })

  assert.equal(result.status, 1)
  assert.match(result.stdout, /custom skill must move to \.agents\/skills\/native-only/)
})

test('rejects unquoted flow-style values with unmatched brackets or braces', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'broken-skill',
    '---\nname: broken-skill\ndescription: [unterminated\n---\n'
  )

  const report = await inspectAgentSkills(projectRoot)
  const output = formatAgentSkillReport(report)

  assert.match(output, /frontmatter field "description" has unmatched brackets or braces/)
})

test('accepts quoted or balanced flow-style values in frontmatter', async (t) => {
  const projectRoot = await createProject(t)

  await writeSkill(
    projectRoot,
    '.agents/skills',
    'quoted-skill',
    '---\nname: quoted-skill\ndescription: "[unterminated"\n---\n'
  )
  await writeSkill(
    projectRoot,
    '.agents/skills',
    'balanced-skill',
    '---\nname: balanced-skill\ndescription: [balanced, items]\n---\n'
  )

  const report = await inspectAgentSkills(projectRoot)

  assert.deepEqual(report.errors, [])
})

test('accepts unquoted descriptions with a single-sided closing delimiter', () => {
  const closingBrace = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: Remove trailing } from output\n---\n',
    'test/SKILL.md'
  )
  assert.equal(closingBrace.error, null)
  assert.equal(closingBrace.values.description, 'Remove trailing } from output')

  const closingBracket = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: Remove trailing ] from output\n---\n',
    'test/SKILL.md'
  )
  assert.equal(closingBracket.error, null)
  assert.equal(closingBracket.values.description, 'Remove trailing ] from output')
})

test('rejects unquoted descriptions with a mismatched closing delimiter', () => {
  const mismatched = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: [opened but} closed wrong\n---\n',
    'test/SKILL.md'
  )
  assert.equal(
    mismatched.error,
    'test/SKILL.md: frontmatter field "description" has unmatched brackets or braces'
  )
})

test('applies the same delimiter validation to block-scalar descriptions', () => {
  const validBlockScalar = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: >\n  Remove trailing } from output\n---\n',
    'test/SKILL.md'
  )
  assert.equal(validBlockScalar.error, null)
  assert.equal(validBlockScalar.values.description, 'Remove trailing } from output')

  const invalidBlockScalar = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: >\n  [unterminated\n---\n',
    'test/SKILL.md'
  )
  assert.equal(
    invalidBlockScalar.error,
    'test/SKILL.md: frontmatter field "description" has unmatched brackets or braces'
  )
})

test('parseSkillFrontmatter validates brackets, braces, and quotes', () => {
  const malformedBracket = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: [unterminated\n---\n',
    'test/SKILL.md'
  )
  assert.equal(
    malformedBracket.error,
    'test/SKILL.md: frontmatter field "description" has unmatched brackets or braces'
  )

  const malformedBrace = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: {unterminated\n---\n',
    'test/SKILL.md'
  )
  assert.equal(
    malformedBrace.error,
    'test/SKILL.md: frontmatter field "description" has unmatched brackets or braces'
  )

  const quotedValue = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: "[unterminated"\n---\n',
    'test/SKILL.md'
  )
  assert.equal(quotedValue.error, null)
  assert.equal(quotedValue.values.description, '[unterminated')

  const balancedValue = parseSkillFrontmatter(
    '---\nname: test-skill\ndescription: [item1, item2]\n---\n',
    'test/SKILL.md'
  )
  assert.equal(balancedValue.error, null)
  assert.equal(balancedValue.values.description, '[item1, item2]')

  const malformedName = parseSkillFrontmatter(
    '---\nname: [bad-name\ndescription: valid\n---\n',
    'test/SKILL.md'
  )
  assert.equal(
    malformedName.error,
    'test/SKILL.md: frontmatter field "name" has unmatched brackets or braces'
  )
})

test('accepts indented --- inside folded block scalar without prematurely closing frontmatter', () => {
  const content = `---
name: folded-skill
description: >
  Here is an example:
    ---
  The rest of the description.
---

Instructions.
`
  const result = parseSkillFrontmatter(content, 'test/SKILL.md')

  assert.equal(result.error, null)
  assert.equal(result.values.name, 'folded-skill')
  assert.match(result.values.description, /Here is an example: --- The rest of the description\./)
})

test('inspects symlinked native skill directories and rejects custom skills', async (t) => {
  const projectRoot = await createProject(t)

  const externalSkillDir = join(projectRoot, 'external-skill')
  await mkdir(externalSkillDir, { recursive: true })
  await writeFile(
    join(externalSkillDir, 'SKILL.md'),
    createSkillContent('symlinked-skill'),
    'utf8'
  )

  const devinSkillsDir = join(projectRoot, '.devin/skills')
  await mkdir(devinSkillsDir, { recursive: true })
  await symlink(externalSkillDir, join(devinSkillsDir, 'symlinked-skill'))

  const report = await inspectAgentSkills(projectRoot)

  assert.match(
    report.errors.join('\n'),
    /custom skill must move to \.agents\/skills\/symlinked-skill/
  )
})
