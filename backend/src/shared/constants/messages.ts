// ─── Auth Messages ──────────────────────────────────────────
export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  GOOGLE_LOGIN_SUCCESS: 'Google login successful',
  FORGOT_PASSWORD_SUCCESS: 'Password reset link has been sent to your email',
  RESET_PASSWORD_SUCCESS: 'Password has been reset successfully',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  GOOGLE_AUTH_FAILED: 'Google authentication failed',
  GOOGLE_INVALID_TOKEN: 'Invalid Google token',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  GET_ME_SUCCESS: 'Current user retrieved successfully',
} as const;

// ─── Validation Messages ────────────────────────────────────
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must be a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_MAX_LENGTH: 'Password must be at most 128 characters',
  PASSWORD_WEAK: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  FULL_NAME_REQUIRED: 'Full name is required',
  FULL_NAME_MIN_LENGTH: 'Full name must be at least 2 characters',
  FULL_NAME_MAX_LENGTH: 'Full name must be at most 100 characters',
  RESET_TOKEN_REQUIRED: 'Reset token is required',
  NEW_PASSWORD_REQUIRED: 'New password is required',
  GOOGLE_TOKEN_REQUIRED: 'Google ID token is required',
} as const;

// ─── Swagger Descriptions ───────────────────────────────────
export const SWAGGER_DESCRIPTIONS = {
  AUTH_TAG: 'Authentication',
  REGISTER: 'Register a new user account',
  LOGIN: 'Login with email and password',
  GOOGLE_LOGIN: 'Login or register with Google',
  FORGOT_PASSWORD: 'Request a password reset link',
  RESET_PASSWORD: 'Reset password using a valid reset token',
  GET_ME: 'Get current authenticated user',
  EMAIL_EXAMPLE: 'user@example.com',
  PASSWORD_EXAMPLE: 'StrongP@ss1',
  FULL_NAME_EXAMPLE: 'Nguyen Van A',
  GOOGLE_TOKEN_EXAMPLE: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  RESET_TOKEN_EXAMPLE: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
} as const;
