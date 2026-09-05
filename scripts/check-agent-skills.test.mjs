import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  formatAgentSkillReport,
  inspectAgentSkills
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

  assert.deepEqual(report.errors, [])
  assert.equal(report.canonicalCount, 1)
  assert.equal(report.generatedAdapterCount, 1)
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
