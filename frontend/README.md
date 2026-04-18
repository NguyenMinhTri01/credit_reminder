# Frontend - Credit Reminder

Next.js frontend, modern UI stack.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Server State**: TanStack Query v5
- **Client State**: Zustand v5
- **Validation**: Zod
- **i18n**: next-intl (vi/en)
- **Testing**: Jest + React Testing Library
- **Package Manager**: pnpm

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css             # Global styles + CSS variables
│   │   ├── layout.tsx              # Root layout (i18n + QueryProvider)
│   │   └── page.tsx                # Home page
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   └── language-switcher.tsx   # Language toggle component
│   ├── hooks/
│   │   └── use-reminders.ts        # TanStack Query hooks for reminders
│   ├── i18n/
│   │   └── request.ts             # next-intl configuration
│   ├── lib/
│   │   ├── api-client.ts          # Fetch-based API client
│   │   ├── utils.ts               # cn() utility for shadcn
│   │   └── validations.ts         # Zod validation schemas
│   ├── messages/
│   │   ├── vi.json                # Vietnamese translations
│   │   └── en.json                # English translations
│   ├── providers/
│   │   └── query-provider.tsx     # TanStack Query provider
│   ├── stores/
│   │   └── ui-store.ts            # Zustand UI state store
│   └── __tests__/
│       └── utils.test.ts          # Unit tests
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

## Environment Variables

| Variable               | Default                          | Description         |
| ---------------------- | -------------------------------- | ------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3001/api/v1`   | Backend API URL     |
