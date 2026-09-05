# User Auth Specification

## Purpose

Covers JWT token lifecycle management and refresh mechanisms across backend and frontend.
The backend issues short-lived access tokens (15 min) and long-lived refresh tokens (7 days);
the frontend transparently refreshes access tokens before they expire so users remain
authenticated across sessions.

## Requirements

### Requirement: Token Refresh via Refresh Token
The system SHALL expose a `POST /auth/refresh` endpoint that accepts a valid refresh token
and returns a new access/refresh token pair without requiring the user to re-enter credentials.

#### Scenario: Successful refresh
- **GIVEN** a user holds a valid, non-expired refresh token
- **WHEN** `POST /auth/refresh` is called with `{ "refreshToken": "<token>" }`
- **THEN** the response is 200 OK with a new `{ accessToken, refreshToken }` pair

#### Scenario: Expired or invalid refresh token
- **GIVEN** a refresh token that is expired or malformed
- **WHEN** `POST /auth/refresh` is called
- **THEN** the response is 401 Unauthorized

### Requirement: Proactive Client-Side Token Refresh
The frontend authentication layer SHALL automatically refresh the access token before it
expires, without any user interaction.

#### Scenario: Access token approaching expiry
- **GIVEN** an authenticated session where the access token will expire within 1 minute
- **WHEN** any server component or API call is made
- **THEN** the `jwt` callback silently calls `POST /auth/refresh` and updates the session
  with the new token pair

#### Scenario: Refresh token also expired
- **GIVEN** an authenticated session where both the access token and refresh token are expired
- **WHEN** the `jwt` callback attempts to refresh
- **THEN** `session.error` is set to `"RefreshAccessTokenError"` so the UI can redirect to login
