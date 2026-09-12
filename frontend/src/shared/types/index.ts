import { UserRole, ReminderStatus, SortOrder } from '../enums'

// ─── Base Types ──────────────────────────────────────────────
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// ─── User Types ──────────────────────────────────────────────
export interface IUser extends BaseEntity {
  email: string
  name: string
  role: UserRole
}

export interface ICreateUserDto {
  email: string
  name: string
  password: string
  role?: UserRole
}

export interface IUpdateUserDto {
  email?: string
  name?: string
  role?: UserRole
}

// ─── Auth Types ──────────────────────────────────────────────
export interface ILoginDto {
  email: string
  password: string
}

export interface IAuthTokens {
  accessToken: string
  refreshToken: string
}

export interface IAuthResponse {
  user: IUser
  tokens: IAuthTokens
}

// ─── Reminder Types ─────────────────────────────────────────
export interface IReminder extends BaseEntity {
  title: string
  description?: string
  amount: number
  dueDate: Date
  status: ReminderStatus
  userId: string
}

export interface ICreateReminderDto {
  title: string
  description?: string
  amount: number
  dueDate: string
}

export interface IUpdateReminderDto {
  title?: string
  description?: string
  amount?: number
  dueDate?: string
  status?: ReminderStatus
}

// ─── API Response Types ──────────────────────────────────────
export interface IApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface IApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

export interface IPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface IPaginatedResponse<T> {
  items: T[]
  meta: IPaginationMeta
}

// ─── Query Params Types ─────────────────────────────────────
export interface IPaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
}

export interface ISearchParams extends IPaginationParams {
  search?: string
}

// ─── Credit Card Types ───────────────────────────────────────
export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired'
export type TransactionType = 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
export type CardType = 'VISA' | 'MASTERCARD' | 'AMERICAN_EXPRESS' | 'JCB' | 'NAPAS'

export interface IBankCatalogEntry {
  bankCode: string
  name: string
  shortName: string
  logoPath: string
  category: 'state-owned' | 'private' | 'international' | 'finance-company'
}

export interface ICardScheduleConfig {
  timeZone: string
}

export interface ICreditCard {
  id: string
  userId: string
  bankCode: string | null
  cardType: CardType | null
  bankName: string
  bankShortName: string | null
  logoPath: string | null
  cardName: string
  lastFourDigits: string | null
  cardNumberMasked: string | null
  creditLimit: string | null
  availableCredit: string | null
  utilizationPercent: number | null
  statementDay: number | null
  paymentDueDaysAfterStatement: number | null
  dueDay: number | null
  expiryMonth: number | null
  expiryYear: number | null
  expiryStatus: ExpiryStatus | null
  scheduleInfo: {
    statementDate: string | null
    nextDueDate: string | null
    daysUntilDue: number | null
  }
  lastReconciledAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ICreditCardDetail = ICreditCard

export interface ITransaction {
  id: string
  cardId: string
  type: TransactionType
  amount: string
  transactionDate: string
  description: string | null
  merchant: string | null
  idempotencyKey: string | null
  reconciledAt: string | null
  createdAt: string
}

export interface ICreateCreditCardPayload {
  bankCode: string
  cardType: CardType
  cardName?: string
  lastFourDigits: string
  creditLimit: string
  availableCredit: string
  statementDay: number
  paymentDueDaysAfterStatement: number
  expiryMonth?: number
  expiryYear?: number
}

export interface IUpdateCreditCardPayload {
  bankCode?: string
  cardType?: CardType
  cardName?: string
  lastFourDigits?: string
  creditLimit?: string
  statementDay?: number
  paymentDueDaysAfterStatement?: number
  expiryMonth?: number
  expiryYear?: number
}

export interface ICreateTransactionPayload {
  type: 'EXPENSE' | 'PAYMENT' | 'REFUND'
  amount: string
  transactionDate: string
  description?: string
  merchant?: string
  idempotencyKey?: string
}

export interface IReconcilePayload {
  availableCredit: string
}

// ─── Dashboard Types ────────────────────────────────────────
export interface IDashboardSummary {
  cardCount: number
  totalCreditLimit: string
  totalCurrentBalance: string
  availableCredit: string
  utilizationPercent: number | null
  hasUnknownLimits: boolean
}

export interface IDashboardCard {
  id: string
  bankName: string
  bankCode: string | null
  cardType: CardType | null
  bankShortName: string | null
  logoPath: string | null
  cardName: string
  lastFourDigits: string | null
  cardNumberMasked: string | null
  creditLimit: string | null
  currentBalance: string
  availableCredit: string | null
  utilizationPercent: number | null
  nextDueDate: string | null
  daysUntilDue: number | null
  statementDate: string | null
  expiryStatus: ExpiryStatus | null
  expiryMonth: number | null
  expiryYear: number | null
}

export interface IDashboardReminder {
  id: string
  title: string
  amount: string | null
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME' | null
  nextTriggerDate: string
}

export interface IDashboardSnapshot {
  generatedAt: string
  summary: IDashboardSummary
  cards: IDashboardCard[]
  upcomingReminders: IDashboardReminder[]
}
