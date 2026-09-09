import { renderHook } from '@testing-library/react'
import { useBankCatalog } from '@/hooks/use-bank-catalog'
import type { IBankCatalogEntry } from '@/shared'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

const mockUseSession = useSession as jest.Mock
const mockUseQuery = useQuery as jest.Mock

describe('hooks/use-bank-catalog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty banks and disables the query when the session is absent', () => {
    mockUseSession.mockReturnValue({ data: null })
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

    const { result } = renderHook(() => useBankCatalog())

    expect(result.current).toEqual({ banks: [], isLoading: false, error: null })

    const options = mockUseQuery.mock.calls[0][0]
    expect(options.queryKey).toEqual(['bank-catalog'])
    expect(options.enabled).toBe(false)
  })

  it('returns bank data and enables the query when the session is present', () => {
    mockUseSession.mockReturnValue({ data: { accessToken: 'token' } })
    const banks: IBankCatalogEntry[] = [
      {
        bankCode: 'vcb',
        name: 'Vietcombank',
        shortName: 'VCB',
        logoPath: '/images/banks/vcb.svg',
        category: 'state-owned',
      },
    ]
    mockUseQuery.mockReturnValue({ data: banks, isLoading: false, error: null })

    const { result } = renderHook(() => useBankCatalog())

    expect(result.current.banks).toEqual(banks)

    const options = mockUseQuery.mock.calls[0][0]
    expect(options.queryKey).toEqual(['bank-catalog'])
    expect(options.enabled).toBe(true)
  })
})
