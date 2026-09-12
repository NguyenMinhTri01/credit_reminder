import { CardType } from '@prisma/client';
import { UserRole, ReminderStatus, SortOrder } from '../enums';
import { IBankCatalogEntry } from '../constants/bank-catalog';

export type { CardType } from '@prisma/client';

// ─── Base Types ──────────────────────────────────────────────
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── User Types ──────────────────────────────────────────────
export interface IUser extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
}

export interface ICreateUserDto {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface IUpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
}

// ─── Auth Types ──────────────────────────────────────────────

/**
 * Shape of the user object attached to the Express request by JwtStrategy.validate().
 * Consumed by @Req() in any controller that uses AuthGuard('jwt').
 */
export interface IAuthenticatedUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface ICardScheduleConfig {
  timeZone: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}

// ─── Reminder Types ─────────────────────────────────────────
export interface IReminder extends BaseEntity {
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status: ReminderStatus;
  userId: string;
}

export interface ICreateReminderDto {
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
}

export interface IUpdateReminderDto {
  title?: string;
  description?: string;
  amount?: number;
  dueDate?: string;
  status?: ReminderStatus;
}

// ─── API Response Types ──────────────────────────────────────
export interface IApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface IApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  items: T[];
  meta: IPaginationMeta;
}

// ─── Query Params Types ─────────────────────────────────────
export interface IPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ISearchParams extends IPaginationParams {
  search?: string;
}

// ─── Dashboard Types ────────────────────────────────────────
export interface IDashboardSummary {
  cardCount: number;
  totalCreditLimit: string;
  totalCurrentBalance: string;
  availableCredit: string;
  utilizationPercent: number | null;
  hasUnknownLimits: boolean;
}

export interface IDashboardCard {
  id: string;
  bankName: string;
  bankCode: string | null;
  cardType: CardType | null;
  bankShortName: string | null;
  logoPath: string | null;
  cardName: string;
  lastFourDigits: string | null;
  cardNumberMasked: string | null;
  creditLimit: string | null;
  currentBalance: string;
  availableCredit: string | null;
  utilizationPercent: number | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
  statementDate: string | null;
  expiryStatus: ExpiryStatus | null;
  expiryMonth: number | null;
  expiryYear: number | null;
}

export interface IDashboardReminder {
  id: string;
  title: string;
  amount: string | null;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME' | null;
  nextTriggerDate: string;
}

// ─── Credit Card Types ───────────────────────────────────────
export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired';

export interface IScheduleInfo {
  statementDate: string | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
}

export interface ICreditCard {
  id: string;
  userId: string;
  bankCode: string | null;
  cardType: CardType | null;
  bankName: string;
  cardName: string;
  lastFourDigits: string | null;
  cardNumberMasked: string | null;
  creditLimit: string | null;
  availableCredit: string | null;
  utilizationPercent: number | null;
  statementDay: number | null;
  paymentDueDaysAfterStatement: number | null;
  dueDay: number | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  lastReconciledAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed
  bankShortName: string | null;
  logoPath: string | null;
  expiryStatus: ExpiryStatus | null;
  scheduleInfo: IScheduleInfo;
}

export type ICreditCardDetail = ICreditCard;

export type ICreditCardListItem = ICreditCard;

export interface ITransaction {
  id: string;
  cardId: string;
  type: 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  amount: string;
  transactionDate: string;
  description: string | null;
  merchant: string | null;
  idempotencyKey: string | null;
  reconciledAt: string | null;
  createdAt: string;
}

export interface ICreateCreditCardDto {
  bankCode: string;
  cardType: CardType;
  cardName?: string;
  lastFourDigits: string;
  creditLimit: string;
  availableCredit: string;
  statementDay: number;
  paymentDueDaysAfterStatement: number;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface IUpdateCreditCardDto {
  bankCode?: string;
  cardType?: CardType;
  cardName?: string;
  lastFourDigits?: string;
  creditLimit?: string;
  statementDay?: number;
  paymentDueDaysAfterStatement?: number;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface ICreateTransactionDto {
  type: 'EXPENSE' | 'PAYMENT' | 'REFUND';
  amount: string;
  transactionDate: string;
  description?: string;
  merchant?: string;
  idempotencyKey?: string;
}

export interface IReconcileDto {
  availableCredit: string;
}

// Re-export IBankCatalogEntry for convenience
export { IBankCatalogEntry };

export interface IDashboardSnapshot {
  generatedAt: string;
  summary: IDashboardSummary;
  cards: IDashboardCard[];
  upcomingReminders: IDashboardReminder[];
}
