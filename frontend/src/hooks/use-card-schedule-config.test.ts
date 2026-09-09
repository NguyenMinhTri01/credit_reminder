import { renderHook } from '@testing-library/react'
import { useCardScheduleConfig } from '@/hooks/use-card-schedule-config'
import { apiClient } from '@/lib/api-client'
import { CARD_SCHEDULE_CONFIG_PATH } from '@/shared/constants'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }))
jest.mock('@/lib/api-client', () => ({ apiClient: { get: jest.fn() } }))

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

const mockUseSession = useSession as jest.Mock
const mockUseQuery = useQuery as jest.Mock

describe('useCardScheduleConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses the configured timezone returned by the backend', () => {
    mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
    mockUseQuery.mockReturnValue({ data: { timeZone: 'America/New_York' } })

    const { result } = renderHook(() => useCardScheduleConfig())
    const options = mockUseQuery.mock.calls[0][0]

    expect(result.current.timeZone).toBe('America/New_York')
    expect(options.queryKey).toEqual(['card-schedule-config'])
    expect(options.enabled).toBe(true)
  })

  it('uses the authenticated API request and safe default while config is unavailable', async () => {
    mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
    mockUseQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useCardScheduleConfig())
    const options = mockUseQuery.mock.calls[0][0]
    await options.queryFn()

    expect(result.current.timeZone).toBe('Asia/Ho_Chi_Minh')
    expect(apiClient.get).toHaveBeenCalledWith(CARD_SCHEDULE_CONFIG_PATH, { accessToken: 'token' })
  })
})
