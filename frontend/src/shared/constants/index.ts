// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const MAX_LIMIT = 100

// ─── Auth ────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = '15m'
export const REFRESH_TOKEN_EXPIRY = '7d'
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
// At least 1 lowercase, 1 uppercase, 1 digit, 1 special character. Mirrors backend.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

// ─── Validation ──────────────────────────────────────────────
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 100
export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 200
export const DESCRIPTION_MAX_LENGTH = 1000

// ─── API ─────────────────────────────────────────────────────
export const API_PREFIX = '/api'
export const API_VERSION = 'v1'
export const API_BASE_PATH = `${API_PREFIX}/${API_VERSION}`

// ─── Date Formats ────────────────────────────────────────────
export const DATE_FORMAT = 'yyyy-MM-dd'
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
