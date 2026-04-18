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

- **Node.js** >= 20
- **pnpm** >= 9
- **PostgreSQL** local or Docker

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm build:shared

# 3. Setup backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
pnpm db:generate
pnpm db:migrate

# 4. Setup frontend
cp frontend/.env.example frontend/.env.local

# 5. Start both servers
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
| `pnpm db:generate`  | Generate Prisma client                |
| `pnpm db:migrate`   | Run database migrations               |
| `pnpm db:studio`    | Open Prisma Studio                    |

## URLs

| Service          | URL                                |
| ---------------- | ---------------------------------- |
| Frontend         | http://localhost:3000               |
| Backend API      | http://localhost:3001/api/v1        |
| Swagger Docs     | http://localhost:3001/api/docs      |

## Project Details

- Backend: [backend/README.md](./backend/README.md)
- Frontend: [frontend/README.md](./frontend/README.md)
