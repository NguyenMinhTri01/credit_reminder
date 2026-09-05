## Overview

Bug fix restoring session continuity after the backend access token (15 min TTL) expires.
Two coordinated changes: a new backend refresh endpoint and proactive frontend token rotation
inside the NextAuth JWT callback.

## Backend: POST /auth/refresh

**File**: `backend/src/auth/auth.service.ts`

`AuthService.refreshToken(token: string)` calls `JwtService.verifyAsync` with the same
`JWT_SECRET` used for access tokens. On success it calls the private `generateTokens`
helper to issue a fresh `{ accessToken, refreshToken }` pair. On any verification error it
throws `UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID)`.

**File**: `backend/src/auth/auth.controller.ts`

`POST /auth/refresh` — accepts `RefreshTokenDto { refreshToken: string }`, delegates to
`AuthService.refreshToken`, returns the new token pair. HTTP 200 on success, 401 on failure.

**File**: `backend/src/auth/dto/refresh-token.dto.ts`

`RefreshTokenDto` with `@IsString() @IsNotEmpty()` validation.

## Frontend: Proactive Token Refresh

**File**: `frontend/src/lib/auth.ts`

`getTokenExpiry(jwt)` — decodes the JWT payload with `Buffer.from(..., 'base64url')` and
returns `exp * 1000` (ms). Returns `0` on any parse error.

`jwt` callback changes:
1. On first sign-in (Credentials or Google) — stores `accessTokenExpiresAt = getTokenExpiry(accessToken)` in the JWT token.
2. On subsequent calls — if `accessTokenExpiresAt` is set and `Date.now() >= expiresAt - 60_000` (1 min buffer), calls `POST /auth/refresh`.
3. On refresh success — updates `accessToken`, `refreshToken`, `accessTokenExpiresAt`.
4. On refresh failure (non-OK, network error, or no `refreshToken`) — sets `token.error = 'RefreshAccessTokenError'`.

`session` callback — propagates `token.error` to `session.error`.

**File**: `frontend/src/types/next-auth.d.ts`

`JWT` augmented with `accessTokenExpiresAt?: number` and `error?: string`.
`Session` augmented with `error?: string`.

## Non-Goals

- No schema migrations (read-only fix).
- No UI changes for `RefreshAccessTokenError` state (out of scope — existing `error.tsx`
  boundaries already handle this by prompting re-login).
