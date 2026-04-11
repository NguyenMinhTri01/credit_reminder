# Backend - Credit Reminder API

NestJS backend API with PostgreSQL database and Prisma ORM.

## Tech Stack

- **Runtime**: Node.js >= 20
- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **API Docs**: Swagger (available at `/api/docs`)
- **Validation**: class-validator + class-transformer
- **Testing**: Jest
- **Package Manager**: pnpm

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── prisma.config.ts            # Prisma 7 configuration
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── prisma/
│   │   ├── prisma.module.ts    # Prisma module (Global)
│   │   └── prisma.service.ts   # Prisma service
│   ├── health/
│   │   ├── health.module.ts    # Health check module
│   │   └── health.controller.ts
│   └── reminders/
│       ├── reminders.module.ts
│       ├── reminders.controller.ts
│       ├── reminders.controller.spec.ts
│       ├── reminders.service.ts
│       ├── reminders.service.spec.ts
│       └── dto/
│           ├── create-reminder.dto.ts
│           ├── update-reminder.dto.ts
│           └── query-reminder.dto.ts
├── test/
│   └── jest-e2e.json           # E2E test config
├── .env.example                # Environment variables template
├── .gitignore
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## Setup

```bash
# From project root
cd backend

# Copy env file
cp .env.example .env

# Install dependencies (from root)
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Available Scripts

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start dev server with hot reload   |
| `pnpm build`      | Build for production               |
| `pnpm start:prod` | Run production build               |
| `pnpm test`       | Run unit tests                     |
| `pnpm test:cov`   | Run tests with coverage            |
| `pnpm test:e2e`   | Run end-to-end tests               |
| `pnpm lint`       | Lint and fix code                  |
| `pnpm db:generate`| Generate Prisma client             |
| `pnpm db:migrate` | Run database migrations            |
| `pnpm db:studio`  | Open Prisma Studio                 |

## API Endpoints

- `GET /api/v1/health` — Health check
- `GET /api/v1/reminders` — List reminders (paginated)
- `POST /api/v1/reminders` — Create reminder
- `GET /api/v1/reminders/:id` — Get reminder by ID
- `PATCH /api/v1/reminders/:id` — Update reminder
- `DELETE /api/v1/reminders/:id` — Delete reminder

Swagger docs: `http://localhost:3001/api/docs`

## Environment Variables

| Variable          | Default                              | Description          |
| ----------------- | ------------------------------------ | -------------------- |
| `DATABASE_URL`    | `postgresql://...`                   | PostgreSQL URL       |
| `PORT`            | `3001`                               | Server port          |
| `NODE_ENV`        | `development`                        | Environment          |
| `JWT_SECRET`      | —                                    | JWT signing key      |
| `CORS_ORIGIN`     | `http://localhost:3000`              | Allowed CORS origin  |
