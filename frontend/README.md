# Frontend - Credit Reminder

Next.js frontend, modern UI stack.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Icons**: Lucide React
- **Auth**: Auth.js v5 (next-auth) — Credentials + Google
- **Forms**: react-hook-form + Zod
- **Server State**: TanStack Query v5
- **Client State**: Zustand v5
- **i18n**: next-intl (vi/en)
- **Testing**: Jest + React Testing Library
- **Package Manager**: pnpm

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Public auth route group
│   │   │   ├── layout.tsx          # Background + centered card
│   │   │   ├── login/page.tsx      # Login + Register tabs
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── api/auth/[...nextauth]/route.ts # Auth.js handler
│   │   ├── home/page.tsx           # Authenticated landing
│   │   ├── system-theme/page.tsx   # Design system reference
│   │   ├── globals.css             # Global styles + theme tokens
│   │   └── layout.tsx              # Root layout (i18n + Session + Query)
│   ├── assets/                     # Images & icons imported in code
│   ├── components/
│   │   ├── auth/                   # Auth-specific UI (forms, inputs)
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/
│   │   ├── use-auth.ts             # Session + signOut helper
│   │   └── use-reminders.ts        # TanStack Query hooks
│   ├── i18n/request.ts             # next-intl configuration
│   ├── lib/
│   │   ├── auth.ts                 # next-auth (Auth.js v5) config
│   │   ├── auth-api.ts             # Direct REST calls to /auth/*
│   │   ├── api-client.ts           # Fetch client (auto-injects bearer)
│   │   ├── utils.ts                # cn() utility
│   │   └── validations.ts          # Zod schemas
│   ├── messages/                   # next-intl translations
│   ├── providers/                  # SessionProvider, QueryProvider
│   ├── stores/ui-store.ts          # Zustand UI store
│   ├── types/next-auth.d.ts        # next-auth module augmentation
│   ├── proxy.ts                    # Route protection (Next 16 proxy)
│   └── __tests__/utils.test.ts
├── .env.example
├── .gitignore
├── components.json                 # shadcn/ui config
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Setup

```bash
# From project root
cd frontend

# Copy env file
cp .env.example .env.local

# Install dependencies (from root)
pnpm install

# Start development server
pnpm dev
```

## Available Scripts

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `pnpm dev`         | Start dev server (port 3000)     |
| `pnpm build`       | Build for production             |
| `pnpm start`       | Run production build             |
| `pnpm lint`        | Lint code                        |
| `pnpm test`        | Run unit tests                   |
| `pnpm test:watch`  | Run tests in watch mode          |
| `pnpm test:cov`    | Run tests with coverage          |

## Key Patterns

### API Calls (TanStack Query)
API calls use custom hooks in `src/hooks/` wrapping TanStack Query with fetch-based `apiClient`.

### State Management (Zustand)
UI state (sidebar, loading, etc.) via Zustand stores in `src/stores/`.

### Validation (Zod)
Form schemas in `src/lib/validations.ts`, sharing constants from `@credit-reminder/shared`.

### i18n
Translations in `src/messages/{locale}.json`. Language switching cookie-based via `LanguageSwitcher`.

### Auth (next-auth + backend JWT)

Flow:

1. **Credentials**: `LoginForm` → `signIn('credentials')` → next-auth Credentials provider calls backend `POST /auth/login` → backend JWT stored in next-auth session JWT (httpOnly cookie).
2. **Google**: `GoogleButton` → `signIn('google')` → Auth.js OAuth → in `jwt` callback we exchange `account.id_token` with backend `POST /auth/google` → backend JWT stored in session cookie.
3. **Register**: `RegisterForm` calls `POST /auth/register` then auto-signs in via Credentials.
4. **Protected routes**: `src/proxy.ts` (Next.js 16 proxy file) redirects unauthenticated users to `/login?callbackUrl=...`.
5. **API calls**: `apiClient` resolves the bearer token from the next-auth session on the server side automatically.

#### Google OAuth setup

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID (type: Web).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
3. Copy `Client ID` & `Client Secret` to `.env.local`.
4. Backend uses the same `GOOGLE_CLIENT_ID` to verify the id_token (`backend/.env`).

## Environment Variables

| Variable                | Default                          | Description                       |
| ----------------------- | -------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:3001/api/v1`   | Backend API URL                   |
| `AUTH_SECRET`           | —                                | next-auth signing secret (required) |
| `NEXTAUTH_URL`          | `http://localhost:3000`          | Site URL (used for OAuth callback)|
| `GOOGLE_CLIENT_ID`      | —                                | Google OAuth client ID            |
| `GOOGLE_CLIENT_SECRET`  | —                                | Google OAuth client secret        |
