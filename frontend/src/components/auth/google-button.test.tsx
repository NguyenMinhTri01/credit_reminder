import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoogleButton } from '@/components/auth/google-button'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'

describe('components/auth/google-button', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render "Login with Google" button', () => {
    render(<GoogleButton />)

    expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument()
  })

  it('should call signIn with google provider and callbackUrl', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce(undefined)

    render(<GoogleButton callbackUrl="/dashboard" />)

    fireEvent.click(screen.getByRole('button', { name: /login with google/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    })
  })

  it('should show error message when signIn throws', async () => {
    ;(signIn as jest.Mock).mockRejectedValueOnce(new Error('fail'))

    render(<GoogleButton />)

    fireEvent.click(screen.getByRole('button', { name: /login with google/i }))

    await waitFor(() => {
      expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument()
    })
  })

  it('should show loading state while signing in', async () => {
    let resolveSignIn: () => void
    ;(signIn as jest.Mock).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSignIn = resolve
      }),
    )

    render(<GoogleButton />)

    fireEvent.click(screen.getByRole('button', { name: /login with google/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    resolveSignIn!()
  })
})
