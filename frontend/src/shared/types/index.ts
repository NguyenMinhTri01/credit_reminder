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
