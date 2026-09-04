import { render, screen } from '@testing-library/react'
import AuthenticatedLayout from './layout'

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}))

describe('authenticated route layout', () => {
  it('keeps /home content inside the reusable shell', () => {
    render(
      <AuthenticatedLayout>
        <span>home content</span>
      </AuthenticatedLayout>,
    )
    expect(screen.getByTestId('app-shell')).toHaveTextContent('home content')
  })
})
