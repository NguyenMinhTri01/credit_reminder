import { render, screen } from '@testing-library/react'
import { AppShell } from './app-shell'

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { name: 'Nguyễn Minh Trí', email: 'tri@example.com' },
    signOut: jest.fn(),
  }),
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

describe('AppShell', () => {
  it('renders semantic navigation, a protected content landmark, and shared responsive shell', () => {
    render(
      <AppShell>
        <div>dashboard child</div>
      </AppShell>,
    )
    expect(screen.getByRole('navigation', { name: 'main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('dashboard child')
    expect(screen.getByRole('link', { name: /dashboard/ })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: /dashboard/ })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps unavailable routes and search disabled with accessible context', () => {
    render(<AppShell>content</AppShell>)
    expect(screen.getByRole('button', { name: /cards/ })).toBeDisabled()
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeDisabled()
    expect(screen.getByPlaceholderText('searchPlaceholder')).toHaveAccessibleDescription(
      'searchUnavailable',
    )
    expect(screen.getByRole('button', { name: 'account' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'toggleSidebar' })).toHaveLength(2)
  })
})
