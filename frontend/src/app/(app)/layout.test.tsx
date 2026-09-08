import { render, screen } from '@testing-library/react'
import AuthenticatedLayout from './layout'

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children, defaultOpen }: { children: React.ReactNode; defaultOpen?: boolean }) => (
    <div data-testid="app-shell" data-default-open={defaultOpen}>
      {children}
    </div>
  ),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: () => undefined,
  }),
}))

describe('authenticated route layout', () => {
  it('keeps /home content inside the reusable shell', async () => {
    const layout = await AuthenticatedLayout({ children: <span>home content</span> })

    render(layout)
    expect(screen.getByTestId('app-shell')).toHaveTextContent('home content')
  })

  it('passes the persisted collapsed state to the client shell', async () => {
    const { cookies } = jest.requireMock('next/headers') as {
      cookies: jest.Mock
    }
    cookies.mockResolvedValueOnce({
      get: () => ({ value: 'false' }),
    })

    const layout = await AuthenticatedLayout({ children: <span>cards content</span> })

    render(layout)
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-default-open', 'false')
  })
})
