import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}))

jest.mock('@/assets/images/wallet.png', () => ({
  default: 'wallet.png',
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: jest.fn().mockReturnValue({ get: () => 'valid-token' }),
}))

jest.mock('@/lib/auth-api', () => ({
  authApi: {
    resetPassword: jest.fn(),
  },
}))

import { authApi } from '@/lib/auth-api'
import { useSearchParams } from 'next/navigation'

describe('app/(auth)/reset-password/page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default: token present.
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => 'valid-token' })
  })

  it('should render invalid reset link when no token', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => null })

    render(<ResetPasswordPage />)

    const heading = await screen.findByRole('heading', { name: /invalid reset link/i })
    expect(heading).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  it('should render reset form when token present', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('should show back to login link', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('should reset password and redirect on success', async () => {
    ;(authApi.resetPassword as jest.Mock).mockResolvedValueOnce({ message: 'ok' })
    const push = jest.fn()
    const refresh = jest.fn()
    const { useRouter } = jest.requireMock('next/navigation')
    useRouter.mockReturnValue({ push, refresh })

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'valid-token',
        newPassword: 'StrongP@ss1',
      })
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login?reset=success')
    })
  })

  it('should show error when reset fails', async () => {
    ;(authApi.resetPassword as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'))

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument()
    })
  })

  it('should show generic error when reset throws non-Error', async () => {
    ;(authApi.resetPassword as jest.Mock).mockRejectedValueOnce('string error')

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/reset failed/i)).toBeInTheDocument()
    })
  })

  it('should show validation error when passwords do not match', async () => {
    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'OtherP@ss2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for weak new password', async () => {
    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'weak' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'weak' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })
})
