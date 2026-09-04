import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegisterForm } from '@/components/auth/register-form'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

jest.mock('@/lib/auth-api', () => ({
  authApi: {
    register: jest.fn(),
  },
}))

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/auth-api'

describe('components/auth/register-form', () => {
  const push = jest.fn()
  const refresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push, refresh })
  })

  it('should render all fields and submit button', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should show validation error for short full name', async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'J' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least/i)).toBeInTheDocument()
    })
  })

  it('should show error when passwords do not match', async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'OtherP@ss2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should register, auto sign-in and redirect to /home', async () => {
    ;(authApi.register as jest.Mock).mockResolvedValueOnce({})
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: null })

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'StrongP@ss1',
        fullName: 'John Doe',
      })
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/home')
    })
  })

  it('should show server error when register fails', async () => {
    ;(authApi.register as jest.Mock).mockRejectedValueOnce(new Error('Email already exists'))

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  it('should show generic error when register throws non-Error', async () => {
    ;(authApi.register as jest.Mock).mockRejectedValueOnce('string error')

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    })
  })

  it('should show error when auto sign-in fails after successful register', async () => {
    ;(authApi.register as jest.Mock).mockResolvedValueOnce({})
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: 'CredentialsSignin' })

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[0], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/password/i)[1], {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/auto sign-in failed/i)).toBeInTheDocument()
    })
  })
})
