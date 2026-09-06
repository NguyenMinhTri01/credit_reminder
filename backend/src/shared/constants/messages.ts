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
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token',
  REFRESH_SUCCESS: 'Token refreshed successfully',
  GET_ME_SUCCESS: 'Current user retrieved successfully',
} as const;

// ─── Validation Messages ────────────────────────────────────
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Email must be a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_MAX_LENGTH: 'Password must be at most 128 characters',
  PASSWORD_WEAK:
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  FULL_NAME_REQUIRED: 'Full name is required',
  FULL_NAME_MIN_LENGTH: 'Full name must be at least 2 characters',
  FULL_NAME_MAX_LENGTH: 'Full name must be at most 100 characters',
  RESET_TOKEN_REQUIRED: 'Reset token is required',
  NEW_PASSWORD_REQUIRED: 'New password is required',
  GOOGLE_TOKEN_REQUIRED: 'Google ID token is required',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
} as const;

// ─── Credit Card Messages ───────────────────────────────────
export const CREDIT_CARD_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Credit card created successfully',
  UPDATE_SUCCESS: 'Credit card updated successfully',
  DELETE_SUCCESS: 'Credit card deleted successfully',
  RESTORE_SUCCESS: 'Credit card restored successfully',
  RECONCILE_SUCCESS: 'Credit card reconciled successfully',
  BANK_CATALOG_SUCCESS: 'Bank catalog retrieved successfully',
  LIST_SUCCESS: 'Credit cards retrieved successfully',
  FIND_ONE_SUCCESS: 'Credit card retrieved successfully',
  // Errors
  NOT_FOUND: 'Credit card not found',
  INVALID_BANK_CODE: 'Bank code is not in the supported catalog',
  // Validation
  BANK_CODE_REQUIRED: 'Bank code is required',
  LAST_FOUR_DIGITS_REQUIRED: 'Last four digits are required',
  LAST_FOUR_DIGITS_FORMAT: 'Last four digits must be exactly 4 numeric characters',
  CREDIT_LIMIT_REQUIRED: 'Credit limit is required',
  CREDIT_LIMIT_POSITIVE: 'Credit limit must be greater than 0',
  CREDIT_LIMIT_FORMAT: 'Credit limit must be a valid decimal string',
  AVAILABLE_CREDIT_FORMAT: 'Available credit must be a valid decimal string',
  STATEMENT_DAY_REQUIRED: 'Statement day is required',
  STATEMENT_DAY_RANGE: 'Statement day must be between 1 and 31',
  PAYMENT_DUE_DAYS_POSITIVE: 'Payment due days after statement must be greater than 0',
  EXPIRY_MONTH_RANGE: 'Expiry month must be between 1 and 12',
  EXPIRY_YEAR_MIN: 'Expiry year must be the current year or later',
  AVAILABLE_CREDIT_RECONCILE_REQUIRED: 'New available credit value is required',
  // Swagger
  SWAGGER_TAG: 'Credit Cards',
  SWAGGER_CREATE: 'Create a new credit card',
  SWAGGER_LIST: 'Get all credit cards for the authenticated user',
  SWAGGER_FIND_ONE: 'Get a credit card by ID',
  SWAGGER_UPDATE: 'Update a credit card',
  SWAGGER_DELETE: 'Soft-delete a credit card',
  SWAGGER_RESTORE: 'Restore a soft-deleted credit card',
  SWAGGER_RECONCILE: 'Manually reconcile available credit',
  SWAGGER_BANKS: 'Get the supported bank catalog',
} as const;

// ─── Transaction Messages ────────────────────────────────────
export const TRANSACTION_MESSAGES = {
  // Success
  CREATE_SUCCESS: 'Transaction created successfully',
  UPDATE_SUCCESS: 'Transaction updated successfully',
  DELETE_SUCCESS: 'Transaction deleted successfully',
  LIST_SUCCESS: 'Transactions retrieved successfully',
  // Errors
  NOT_FOUND: 'Transaction not found',
  PRE_RECONCILIATION_EDIT: 'This transaction predates the last reconciliation and cannot be edited',
  PRE_RECONCILIATION_DELETE:
    'This transaction predates the last reconciliation and cannot be deleted',
  CARD_NOT_FOUND: 'Credit card not found',
  // Validation
  TYPE_REQUIRED: 'Transaction type is required',
  TYPE_INVALID: 'Transaction type must be EXPENSE, PAYMENT, or REFUND',
  AMOUNT_REQUIRED: 'Amount is required',
  AMOUNT_POSITIVE: 'Amount must be greater than 0',
  AMOUNT_FORMAT: 'Amount must be a valid decimal string',
  DATE_REQUIRED: 'Transaction date is required',
  DATE_FORMAT: 'Transaction date must be in YYYY-MM-DD format',
  IDEMPOTENCY_KEY_FORMAT: 'Idempotency key must be a valid UUID',
  // Swagger
  SWAGGER_TAG: 'Transactions',
  SWAGGER_CREATE: 'Create a new transaction for a credit card',
  SWAGGER_LIST: 'Get paginated transactions for a credit card',
  SWAGGER_UPDATE: 'Update a transaction',
  SWAGGER_DELETE: 'Delete a transaction',
} as const;

// ─── Swagger Descriptions ───────────────────────────────────
export const SWAGGER_DESCRIPTIONS = {
  AUTH_TAG: 'Authentication',
  REGISTER: 'Register a new user account',
  LOGIN: 'Login with email and password',
  GOOGLE_LOGIN: 'Login or register with Google',
  FORGOT_PASSWORD: 'Request a password reset link',
  RESET_PASSWORD: 'Reset password using a valid reset token',
  REFRESH: 'Refresh access token using a valid refresh token',
  GET_ME: 'Get current authenticated user',
  EMAIL_EXAMPLE: 'user@example.com',
  PASSWORD_EXAMPLE: 'StrongP@ss1',
  FULL_NAME_EXAMPLE: 'Nguyen Van A',
  GOOGLE_TOKEN_EXAMPLE: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  RESET_TOKEN_EXAMPLE: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
} as const;
