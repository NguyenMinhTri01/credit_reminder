import { render, screen } from '@testing-library/react'
import AuthLayout from '@/app/(auth)/layout'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} data-fill={props.fill} />
  ),
}))

jest.mock('@/assets/images/login_background.png', () => ({
  default: 'login-bg.png',
}))

describe('app/(auth)/layout', () => {
  it('should render children inside main', () => {
    render(
      <AuthLayout>
        <div>form content</div>
      </AuthLayout>,
    )
    expect(screen.getByText('form content')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should render background image with empty alt', () => {
    render(<AuthLayout>x</AuthLayout>)
    expect(screen.getByAltText('')).toBeInTheDocument()
  })
})
