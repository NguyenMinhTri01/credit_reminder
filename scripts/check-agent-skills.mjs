import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SKILL_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const CANONICAL_SKILLS_DIRECTORY = '.agents/skills'
const NATIVE_SKILLS_DIRECTORIES = [
  '.devin/skills',
  '.gemini/skills',
  '.opencode/skills'
]

function hasMatchingQuotes(value) {
  const trimmedValue = value.trim()

  return (
    trimmedValue.length >= 2 &&
    ((trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) ||
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')))
  )
}

function stripQuotes(value) {
  const trimmedValue = value.trim()

  return hasMatchingQuotes(trimmedValue) ? trimmedValue.slice(1, -1) : trimmedValue
}

function hasUnmatchedDelimiters(value) {
  const stack = []
  let activeQuote = null

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (activeQuote) {
      if (char === activeQuote && value[index - 1] !== '\\') {
        activeQuote = null
      }
      continue
    }

    if (
      (char === "'" || char === '"') &&
      (index === 0 || /[\s,\[{:}]/.test(value[index - 1]))
    ) {
      activeQuote = char
      continue
    }

    if (char === '[' || char === '{') {
      stack.push(char)
    } else if (char === ']') {
      if (stack.pop() !== '[') {
        return true
      }
    } else if (char === '}') {
      if (stack.pop() !== '{') {
        return true
      }
    }
  }

  return stack.length > 0
}

function readBlockScalar(lines, startIndex) {
  const values = []

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (line.length > 0 && !/^\s/.test(line)) {
      break
    }

    if (line.trim().length > 0) {
      values.push(line.trim())
    }
  }

  return values.join(' ')
}

function readTopLevelValue(lines, key) {
  const keyPattern = new RegExp(`^${key}:\\s*(.*)$`)

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(keyPattern)

    if (!match) {
      continue
    }

    const value = match[1].trim()

    if (/^[>|][+-]?$/.test(value)) {
      return {
        error: null,
        value: readBlockScalar(lines, index)
      }
    }

    if (!hasMatchingQuotes(value) && hasUnmatchedDelimiters(value)) {
      return {
        error: `frontmatter field "${key}" has unmatched brackets or braces`,
        value: ''
      }
    }

    return {
      error: null,
      value: stripQuotes(value)
    }
  }

  return {
    error: null,
    value: ''
  }
}

function readMetadataValue(lines, key) {
  const metadataIndex = lines.findIndex((line) => /^metadata:\s*$/.test(line))

  if (metadataIndex === -1) {
    return ''
  }

  const keyPattern = new RegExp(`^\\s+${key}:\\s*(.+?)\\s*$`)

  for (let index = metadataIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (line.length > 0 && !/^\s/.test(line)) {
      break
    }

    const match = line.match(keyPattern)

    if (match) {
      return stripQuotes(match[1])
    }
  }

  return ''
}

export function parseSkillFrontmatter(content, skillFilePath) {
  const lines = content.split(/\r?\n/)

  if (lines[0]?.trimEnd() !== '---') {
    return {
      error: `${skillFilePath}: SKILL.md must start with YAML frontmatter`,
      values: null
    }
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---')

  if (closingIndex === -1) {
    return {
      error: `${skillFilePath}: YAML frontmatter is not closed`,
      values: null
    }
  }

  const frontmatterLines = lines.slice(1, closingIndex)
  const nameResult = readTopLevelValue(frontmatterLines, 'name')

  if (nameResult.error) {
    return {
      error: `${skillFilePath}: ${nameResult.error}`,
      values: null
    }
  }

  const descriptionResult = readTopLevelValue(frontmatterLines, 'description')

  if (descriptionResult.error) {
    return {
      error: `${skillFilePath}: ${descriptionResult.error}`,
      values: null
    }
  }

  return {
    error: null,
    values: {
      name: nameResult.value,
      description: descriptionResult.value,
      author: readMetadataValue(frontmatterLines, 'author'),
      generatedBy: readMetadataValue(frontmatterLines, 'generatedBy')
    }
  }
}

async function listSkillDirectories(projectRoot, directory) {
  const absoluteDirectory = join(projectRoot, directory)

  try {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => ({
        absolutePath: join(absoluteDirectory, entry.name),
        directory,
        id: entry.name
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function inspectSkill(skill) {
  const skillFilePath = join(skill.absolutePath, 'SKILL.md')

  try {
    const content = await readFile(skillFilePath, 'utf8')
    const parsedFrontmatter = parseSkillFrontmatter(content, skillFilePath)

    return {
      ...skill,
      error: parsedFrontmatter.error,
      values: parsedFrontmatter.values
    }
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return {
        ...skill,
        error: `${skillFilePath}: missing SKILL.md`,
        values: null
      }
    }

    throw error
  }
}

function validateCanonicalSkill(skill, projectRoot) {
  const errors = []
  const displayPath = relative(projectRoot, skill.absolutePath)

  if (skill.error) {
    errors.push(skill.error)
    return errors
  }

  if (!SKILL_ID_PATTERN.test(skill.id)) {
    errors.push(`${displayPath}: directory name is not a valid lowercase kebab-case skill ID`)
  }

  if (!skill.values.name) {
    errors.push(`${displayPath}/SKILL.md: required frontmatter field "name" is missing`)
  } else if (skill.values.name !== skill.id) {
    errors.push(
      `${displayPath}/SKILL.md: frontmatter name "${skill.values.name}" must match ` +
        `directory "${skill.id}"`
    )
  }

  if (!skill.values.description) {
    errors.push(`${displayPath}/SKILL.md: required frontmatter field "description" is missing`)
  }

  return errors
}

function isGeneratedOpenSpecSkill(skill, canonicalIds) {
  const hasMetadata =
    skill.values?.author === 'openspec' && Boolean(skill.values.generatedBy)

  if (!hasMetadata) {
    return false
  }

  if (!skill.id.startsWith('openspec-')) {
    return false
  }

  if (canonicalIds && !canonicalIds.has(skill.id)) {
    return false
  }

  return true
}

function validateNativeSkill(skill, canonicalIds, projectRoot) {
  const displayPath = relative(projectRoot, skill.absolutePath)

  if (skill.error) {
    return [skill.error]
  }

  if (isGeneratedOpenSpecSkill(skill, canonicalIds)) {
    return []
  }

  if (canonicalIds.has(skill.id)) {
    return [
      `${displayPath}: unexpected collision with ${CANONICAL_SKILLS_DIRECTORY}/${skill.id}`
    ]
  }

  return [
    `${displayPath}: custom skill must move to ` +
      `${CANONICAL_SKILLS_DIRECTORY}/${skill.id}`
  ]
}

export async function inspectAgentSkills(projectRoot) {
  const resolvedRoot = resolve(projectRoot)
  const canonicalDirectories = await listSkillDirectories(
    resolvedRoot,
    CANONICAL_SKILLS_DIRECTORY
  )
  const canonicalSkills = await Promise.all(canonicalDirectories.map(inspectSkill))
  const errors = canonicalSkills.flatMap((skill) => validateCanonicalSkill(skill, resolvedRoot))
  const canonicalIds = new Set(canonicalSkills.map((skill) => skill.id))
  const nativeSkills = []

  if (canonicalSkills.length === 0) {
    errors.push(`${CANONICAL_SKILLS_DIRECTORY}: no canonical skills found`)
  }

  for (const directory of NATIVE_SKILLS_DIRECTORIES) {
    const skillDirectories = await listSkillDirectories(resolvedRoot, directory)
    const inspectedSkills = await Promise.all(skillDirectories.map(inspectSkill))

    nativeSkills.push(...inspectedSkills)
    errors.push(
      ...inspectedSkills.flatMap((skill) =>
        validateNativeSkill(skill, canonicalIds, resolvedRoot)
      )
    )
  }

  return {
    canonicalCount: canonicalSkills.length,
    canonicalSkills,
    errors,
    generatedAdapterCount: nativeSkills.filter((skill) =>
      isGeneratedOpenSpecSkill(skill, canonicalIds)
    ).length,
    nativeSkills,
    projectRoot: resolvedRoot
  }
}

export function formatAgentSkillReport(report) {
  const summary =
    `Agent skills: ${report.canonicalCount} canonical, ` +
    `${report.generatedAdapterCount} generated adapters`

  if (report.errors.length === 0) {
    return `${summary}\nSkill layout is valid.`
  }

  const diagnostics = report.errors.map((error) => `- ${error}`).join('\n')

  return `${summary}\nSkill layout is invalid:\n${diagnostics}`
}

async function main() {
  const projectRoot = process.argv[2] ?? process.cwd()
  const report = await inspectAgentSkills(projectRoot)

  console.log(formatAgentSkillReport(report))

  if (report.errors.length > 0) {
    process.exitCode = 1
  }
}

const currentFilePath = fileURLToPath(import.meta.url)
const invokedFilePath = process.argv[1] ? resolve(process.argv[1]) : ''

const isDirectInvocation =
  invokedFilePath && pathToFileURL(invokedFilePath).href === pathToFileURL(currentFilePath).href

if (isDirectInvocation) {
  await main()
}
