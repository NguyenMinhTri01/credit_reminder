import { render, screen } from '@testing-library/react'
import { AuthCard } from '@/components/auth/auth-card'

// next/image needs to be stubbed in jsdom.
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}))

jest.mock('@/assets/images/wallet.png', () => ({
  default: 'wallet.png',
}))

describe('components/auth/auth-card', () => {
  it('should render title and subtitle', () => {
    render(
      <AuthCard title="Welcome" subtitle="Please sign in">
        <div>form</div>
      </AuthCard>,
    )

    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('Please sign in')).toBeInTheDocument()
  })

  it('should render children', () => {
    render(
      <AuthCard title="Welcome">
        <button>Submit</button>
      </AuthCard>,
    )

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('should not render subtitle when omitted', () => {
    render(<AuthCard title="Welcome">x</AuthCard>)
    expect(screen.queryByText('Please sign in')).not.toBeInTheDocument()
  })
})
