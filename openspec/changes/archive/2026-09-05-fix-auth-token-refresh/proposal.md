## Why

Access tokens issued by the backend expire after 15 minutes (`JWT_ACCESS_EXPIRY=15m`), but
neither the backend nor the frontend had a token-refresh mechanism. After 15 minutes any
authenticated user received an `Unauthorized` (401) error on every page that fetched data,
making the application effectively unusable without a manual re-login.

## What Changes

- **Backend**: New `POST /auth/refresh` endpoint accepts a refresh token and returns a fresh
  access/refresh token pair. Invalid or expired refresh tokens return 401.
- **Frontend**: NextAuth `jwt` callback now records `accessTokenExpiresAt` on sign-in, decodes
  it from the JWT payload, and automatically calls `/auth/refresh` when the access token is
  within 1 minute of expiry. A `RefreshAccessTokenError` is propagated to the session when the
  refresh token is also expired, enabling the UI to redirect the user to login.

## Capabilities

### New Capabilities

- `user-auth`: Authentication lifecycle — login, token issuance, and token refresh.

### Modified Capabilities

<!-- No existing spec files cover auth behavior. -->

## Impact

- `backend/src/auth/auth.service.ts` — `refreshToken()` method added
- `backend/src/auth/auth.controller.ts` — `POST /api/v1/auth/refresh` route added
- `backend/src/auth/dto/refresh-token.dto.ts` — new DTO
- `backend/src/shared/constants/messages.ts` — new message constants
- `frontend/src/lib/auth.ts` — `jwt` callback extended with proactive refresh logic
- `frontend/src/types/next-auth.d.ts` — `JWT` and `Session` types extended
