import { fireEvent, render, screen } from '@testing-library/react'
import { AccountMenu } from './account-menu'

const signOut = jest.fn()
let mockUser: { name?: string | null; email?: string | null } | undefined

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser, signOut }),
}))
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode
    onSelect: () => void
  }) => <button onClick={onSelect}>{children}</button>,
}))

describe('AccountMenu', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  it('prefers the user name and signs out from the grouped menu item', () => {
    mockUser = { name: 'Nguyễn Minh Trí', email: 'tri@example.com' }
    render(<AccountMenu />)
    expect(screen.getByText('Nguyễn Minh Trí')).toBeInTheDocument()
    expect(screen.getByText('NM')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /signOut/ }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('falls back to email and then the localized account label', () => {
    mockUser = { name: null, email: 'tri@example.com' }
    const { rerender } = render(<AccountMenu />)
    expect(screen.getByText('tri@example.com')).toBeInTheDocument()

    mockUser = { name: '   ', email: 'tri@example.com' }
    rerender(<AccountMenu />)
    expect(screen.getByText('tri@example.com')).toBeInTheDocument()

    mockUser = undefined
    rerender(<AccountMenu />)
    expect(screen.getAllByText('account').length).toBeGreaterThan(0)
  })
})
