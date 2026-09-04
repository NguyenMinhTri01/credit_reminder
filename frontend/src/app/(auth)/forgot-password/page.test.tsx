import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}))

jest.mock('@/assets/images/wallet.png', () => ({
  default: 'wallet.png',
}))

jest.mock('@/lib/auth-api', () => ({
  authApi: {
    forgotPassword: jest.fn(),
  },
}))

import { authApi } from '@/lib/auth-api'

describe('app/(auth)/forgot-password/page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form with email field', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('should show back to login link', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('should show success message after submit', async () => {
    ;(authApi.forgotPassword as jest.Mock).mockResolvedValueOnce({ message: 'ok' })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText('Check your inbox')).toBeInTheDocument()
    })
    expect(screen.getByText(/a@b.com/)).toBeInTheDocument()
  })

  it('should show error message when request fails', async () => {
    ;(authApi.forgotPassword as jest.Mock).mockRejectedValueOnce(new Error('Server error'))

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email', async () => {
    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-email' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })
})
