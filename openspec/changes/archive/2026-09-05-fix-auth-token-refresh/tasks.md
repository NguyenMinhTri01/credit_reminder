## Tasks

All tasks are complete — implementation was delivered as a direct hot-fix.

### Backend

- [x] Add `REFRESH_TOKEN_INVALID`, `REFRESH_SUCCESS` to `AUTH_MESSAGES`
- [x] Add `REFRESH_TOKEN_REQUIRED` to `VALIDATION_MESSAGES`
- [x] Add `SWAGGER_DESCRIPTIONS.REFRESH`
- [x] Create `backend/src/auth/dto/refresh-token.dto.ts`
- [x] Implement `AuthService.refreshToken()`
- [x] Add `POST /auth/refresh` to `AuthController`
- [x] Add unit tests in `auth.service.spec.ts` and `auth.controller.spec.ts`

### Frontend

- [x] Implement `getTokenExpiry()` helper in `auth.ts`
- [x] Extend `jwt` callback with proactive refresh logic
- [x] Extend `session` callback to propagate `error`
- [x] Augment `JWT` and `Session` types in `next-auth.d.ts`
- [x] Add refresh flow tests in `auth.test.ts`

### Verification

- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm test` — 276 frontend + 71 backend tests pass
- [x] `pnpm lint` — 0 errors
