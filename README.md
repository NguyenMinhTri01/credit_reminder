# Credit Reminder

Full-stack monorepo. Manage credit payment reminders.

## Architecture

```
credit_reminder/
├── backend/        # NestJS API server (port 3001)
├── frontend/       # Next.js web app (port 3000)
├── shared/         # Shared types, enums, constants, utils
├── pnpm-workspace.yaml
├── package.json    # Root workspace scripts
└── README.md
```

## Tech Stack

### Backend
- **NestJS 11** — Framework
- **PostgreSQL** — Database
- **Prisma 7** — ORM
- **Swagger** — API docs (`/api/docs`)
- **Jest** — Unit testing
- **class-validator** — Request validation

### Frontend
- **Next.js 15** — App Router
- **Tailwind CSS + shadcn/ui** — Styling & components
- **TanStack Query v5** — Server state
- **Zustand v5** — UI state
- **Zod** — Form validation
- **next-intl** — i18n (vi/en)
- **Lucide React** — Icons
- **Jest + React Testing Library** — Testing

### Shared
- Types, interfaces, enums, constants, utils for both backend + frontend
- Published as `@credit-reminder/shared` workspace package

## Prerequisites

- **Node.js** = 24.12.0
- **pnpm** = 10.33.0
- **PostgreSQL** local or Docker

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Setup backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
pnpm db:generate
pnpm db:migrate

# 3. Setup frontend
cp frontend/.env.example frontend/.env.local

# 4. Start both servers
pnpm dev
```

## Workspace Scripts

| Script              | Description                           |
| ------------------- | ------------------------------------- |
| `pnpm dev`          | Start both backend & frontend         |
| `pnpm dev:backend`  | Start backend only                    |
| `pnpm dev:frontend` | Start frontend only                   |
| `pnpm build`        | Build all packages                    |
| `pnpm test`         | Run all tests                         |
| `pnpm lint`         | Lint all packages                     |
| `pnpm skills:check` | Validate the shared agent skill layout |
| `pnpm skills:sync`  | Refresh OpenSpec adapters and validate skills |
| `pnpm db:generate`  | Generate Prisma client                |
| `pnpm db:migrate`   | Run database migrations               |
| `pnpm db:studio`    | Open Prisma Studio                    |

## Shared AI Agent Skills

`.agents/skills` is the canonical, repository-local source for every manually maintained skill.
Keep each complete skill directory there, including its `SKILL.md` and any referenced scripts,
assets, rules, or reference files. Do not copy custom skills into tool-native skill directories.

The supported agents discover the canonical inventory as follows:

| Agent      | Discovery path   | List, reload, or invoke |
| ---------- | ---------------- | ----------------------- |
| Codex      | `.agents/skills` | Invoke `$skill-name` or name the skill in the request |
| Devin      | `.agents/skills` | Invoke `@skills:skill-name`; ask Devin to reload after changes |
| Gemini CLI | `.agents/skills` | Use `/skills list` and `/skills reload` |
| OpenCode   | `.agents/skills` | Invoke by skill ID; restart if discovery is stale |

Tool-native commands and workflows remain separate because their formats differ:

- Devin workflows: `.devin/workflows`
- Gemini CLI commands: `.gemini/commands`
- OpenCode commands: `.opencode/commands`

OpenSpec may also generate target-specific `openspec-*` skills under `.devin/skills`,
`.gemini/skills`, and `.opencode/skills`. These generated adapters are allowed to shadow the
canonical OpenSpec skill because they contain tool-specific invocation syntax. Their frontmatter
must retain `metadata.author: openspec` and `metadata.generatedBy`; no project-authored skill may
use the native directories.

After editing only a canonical project skill, run:

```bash
pnpm skills:check
```

After upgrading OpenSpec or changing its configured integrations, refresh and validate all managed
adapters:

```bash
pnpm skills:sync
```

Review generated adapter changes separately from edits to canonical project skills.

## URLs

| Service          | URL                                |
| ---------------- | ---------------------------------- |
| Frontend         | http://localhost:3000               |
| Backend API      | http://localhost:3001/api/v1        |
| Swagger Docs     | http://localhost:3001/api/docs      |

## Project Details

- Backend: [backend/README.md](./backend/README.md)
- Frontend: [frontend/README.md](./frontend/README.md)
