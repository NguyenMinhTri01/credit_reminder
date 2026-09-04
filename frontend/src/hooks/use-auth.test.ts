import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn().mockReturnValue({}),
}))

import { useSession, signOut } from 'next-auth/react'

describe('hooks/use-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should expose loading state while session resolves', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuth).toBe(false)
    expect(result.current.user).toBeUndefined()
  })

  it('should expose user and auth when authenticated', () => {
    const user = { id: '1', email: 'a@b.com', name: 'A' }
    const accessToken = 'tok'
    ;(useSession as jest.Mock).mockReturnValue({ data: { user, accessToken }, status: 'authenticated' })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuth).toBe(true)
    expect(result.current.user).toEqual(user)
    expect(result.current.accessToken).toBe('tok')
  })

  it('should report unauthenticated when no session', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuth).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should call signOut with /login callbackUrl', () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })

    const { result } = renderHook(() => useAuth())

    result.current.signOut()
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })
})
