import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn().mockReturnValue({ get: () => null }),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

describe('components/auth/login-form', () => {
  const push = jest.fn()
  const refresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push, refresh })
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => null })
  })

  it('should render email and password fields and submit button', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(document.getElementById('login-password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should render forgot password link', () => {
    render(<LoginForm />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  it('should show validation error for invalid email on submit', async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-email' } })
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('should call signIn on valid submit and redirect to /', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: null })

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'a@b.com',
        password: 'pass',
        redirect: false,
      })
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('should show server error when signIn returns error', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: 'CredentialsSignin' })

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('should use callbackUrl from search params', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => '/dashboard' })
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: null })

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard')
    })
  })
})
