import type { CardType } from '../types'

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
export const AUTHENTICATION_REQUIRED_ERROR = 'Authentication required'

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

// ─── Application Time Zone ───────────────────────────────────
/** Default application time zone. Matches the backend default. */
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh'

// ─── API Paths: Credit Cards ─────────────────────────────────
export const CREDIT_CARDS_PATH = '/credit-cards'
export const CREDIT_CARD_PATH = (id: string) => `/credit-cards/${id}`
export const CREDIT_CARD_RESTORE_PATH = (id: string) => `/credit-cards/${id}/restore`
export const CREDIT_CARD_RECONCILE_PATH = (id: string) => `/credit-cards/${id}/reconcile`
export const BANK_CATALOG_PATH = '/credit-cards/banks'
export const CARD_SCHEDULE_CONFIG_PATH = '/credit-cards/schedule-config'

// ─── API Paths: Transactions ─────────────────────────────────
export const TRANSACTIONS_PATH = (cardId: string) => `/credit-cards/${cardId}/transactions`
export const TRANSACTION_PATH = (cardId: string, id: string) =>
  `/credit-cards/${cardId}/transactions/${id}`

// ─── Card Form Validation Limits ────────────────────────────
export const LAST_FOUR_DIGITS_LENGTH = 4
export const STATEMENT_DAY_MIN = 1
export const STATEMENT_DAY_MAX = 31
export const PAYMENT_DUE_DAYS_MIN = 1
export const EXPIRY_MONTH_MIN = 1
export const EXPIRY_MONTH_MAX = 12
export const CREDIT_LIMIT_MIN = 1

// ─── Card types ───────────────────────────────────────────────
export const CARD_TYPE_OPTIONS = [
  {
    value: 'VISA',
    labelKey: 'cardTypes.VISA',
    logoPath: '/images/card-types/visa.svg',
  },
  {
    value: 'MASTERCARD',
    labelKey: 'cardTypes.MASTERCARD',
    logoPath: '/images/card-types/mastercard.svg',
  },
  {
    value: 'AMERICAN_EXPRESS',
    labelKey: 'cardTypes.AMERICAN_EXPRESS',
    logoPath: '/images/card-types/american_express.svg',
  },
  {
    value: 'JCB',
    labelKey: 'cardTypes.JCB',
    logoPath: '/images/card-types/jcb.svg',
  },
  {
    value: 'NAPAS',
    labelKey: 'cardTypes.NAPAS',
    logoPath: '/images/card-types/napas.svg',
  },
] as const satisfies ReadonlyArray<{
  value: CardType
  labelKey: string
  logoPath: string
}>

export const CARD_TYPE_VALUES = CARD_TYPE_OPTIONS.map((option) => option.value)

export function getCardTypeOption(cardType: string | null | undefined) {
  return CARD_TYPE_OPTIONS.find((option) => option.value === cardType)
}

export function isCardType(value: string | null | undefined): value is CardType {
  return getCardTypeOption(value) !== undefined
}

// ─── UI ──────────────────────────────────────────────────────
export const SIDEBAR_COOKIE_NAME = 'sidebar_state'
