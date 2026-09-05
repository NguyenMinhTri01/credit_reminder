import { render, screen } from '@testing-library/react'
import { SessionProvider, SessionErrorHandler } from '@/providers/session-provider'
import { signOut, useSession } from 'next-auth/react'

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('providers/session-provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  it('should render children inside SessionProvider', () => {
    render(
      <SessionProvider>
        <div>child</div>
      </SessionProvider>,
    )
    expect(screen.getByTestId('mock-session-provider')).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  describe('SessionErrorHandler', () => {
    it('should not call signOut when session has no error', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { name: 'Test' }, error: undefined },
      })
      render(<SessionErrorHandler />)
      expect(signOut).not.toHaveBeenCalled()
    })

    it('should call signOut with /login callbackUrl when session has RefreshAccessTokenError', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { name: 'Test' }, error: 'RefreshAccessTokenError' },
      })
      render(<SessionErrorHandler />)
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })
  })
})
