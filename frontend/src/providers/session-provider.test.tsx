import { render, screen } from '@testing-library/react'
import { SessionProvider } from '@/providers/session-provider'

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}))

describe('providers/session-provider', () => {
  it('should render children inside SessionProvider', () => {
    render(
      <SessionProvider>
        <div>child</div>
      </SessionProvider>,
    )
    expect(screen.getByTestId('mock-session-provider')).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
