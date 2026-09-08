# Backend - Credit Reminder API

NestJS backend API, PostgreSQL + Prisma ORM.

## Tech Stack

- **Runtime**: Node.js >= 24.12.0
- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **API Docs**: Swagger (`/api/docs`)
- **Validation**: class-validator + class-transformer
- **Testing**: Jest
- **Package Manager**: pnpm

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── prisma.config.ts            # Prisma 7 configuration
├── database.sql                # Raw SQL reference
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── shared/                 # Shared code (types, enums, constants, utils)
│   │   ├── index.ts
│   │   ├── constants/
│   │   │   ├── index.ts        # All constant exports
│   │   │   └── messages.ts     # AUTH_MESSAGES, VALIDATION_MESSAGES, SWAGGER_DESCRIPTIONS
│   │   ├── enums/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── index.ts
│   ├── prisma/
│   │   ├── prisma.module.ts    # Prisma module (Global)
│   │   └── prisma.service.ts   # Prisma service with adapter-pg
│   ├── health/
│   │   ├── health.module.ts    # Health check module
│   │   └── health.controller.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts # JWT Passport strategy
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── google-auth.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       └── reset-password.dto.ts
│   ├── dashboard/              # Authenticated aggregate dashboard
│   ├── credit-cards/           # Card CRUD, catalog, restore, reconciliation
│   │   └── dto/                # Card request and response DTOs
│   └── transactions/           # Nested card transaction CRUD and pagination
│       └── dto/                # Transaction request, response, and query DTOs
├── test/
│   └── jest-e2e.json           # E2E test config
├── .env.example                # Environment variables template
├── .windsurfrules              # Backend-specific AI rules
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

### Health
- `GET /api/v1/health` — Health check

### Auth
- `POST /api/v1/auth/register` — Register user
- `POST /api/v1/auth/login` — Login with email + password
- `POST /api/v1/auth/google` — Login/register via Google
- `POST /api/v1/auth/refresh` — Refresh an access token
- `POST /api/v1/auth/forgot-password` — Request password reset
- `POST /api/v1/auth/reset-password` — Reset password with token
- `GET /api/v1/auth/me` — Get the authenticated user profile

### Dashboard
- `GET /api/v1/dashboard` — Get the authenticated user's aggregate dashboard snapshot

### Credit Cards
- `GET /api/v1/credit-cards/banks` — Get the supported bank catalog
- `POST /api/v1/credit-cards` — Create a card
- `GET /api/v1/credit-cards` — List active cards
- `GET /api/v1/credit-cards/:id` — Get card details
- `PATCH /api/v1/credit-cards/:id` — Update card metadata
- `DELETE /api/v1/credit-cards/:id` — Soft-delete a card
- `POST /api/v1/credit-cards/:id/restore` — Restore a soft-deleted card
- `POST /api/v1/credit-cards/:id/reconcile` — Reconcile available credit

### Card Transactions
- `POST /api/v1/credit-cards/:cardId/transactions` — Create a transaction
- `GET /api/v1/credit-cards/:cardId/transactions` — List transactions with pagination
- `PATCH /api/v1/credit-cards/:cardId/transactions/:id` — Update a transaction
- `DELETE /api/v1/credit-cards/:cardId/transactions/:id` — Delete a transaction

Swagger at `http://localhost:3001/api/docs` is the canonical source for authentication,
request/response schemas, validation rules, pagination parameters, and examples.

## Migration Compatibility

The credit-card management fields and transaction type are introduced by one combined migration.
Legacy cards without a credit limit preserve `NULL` available credit. See the
[post-review remediation record](../docs/credit-card-management-post-review.md) for the deployment
caveat and validation guidance.

## Environment Variables

| Variable              | Default                              | Description              |
| --------------------- | ------------------------------------ | ------------------------ |
| `DATABASE_URL`        | `postgresql://...`                   | PostgreSQL connection    |
| `PORT`                | `3001`                               | Server port              |
| `NODE_ENV`            | `development`                        | Environment              |
| `JWT_SECRET`          | —                                    | JWT signing key          |
| `JWT_ACCESS_EXPIRY`   | `15m`                                | Access token expiry      |
| `JWT_REFRESH_EXPIRY`  | `7d`                                 | Refresh token expiry     |
| `GOOGLE_CLIENT_ID`    | —                                    | Google OAuth client ID   |
| `GOOGLE_CLIENT_SECRET`| —                                    | Google OAuth secret      |
| `CORS_ORIGIN`         | `http://localhost:3000`              | Allowed CORS origin      |
