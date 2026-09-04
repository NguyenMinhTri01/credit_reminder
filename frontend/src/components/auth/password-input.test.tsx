import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordInput } from '@/components/auth/password-input'

describe('components/auth/password-input', () => {
  it('should render password input by default', () => {
    render(<PasswordInput placeholder="Enter password" />)

    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    expect(input.type).toBe('password')
  })

  it('should toggle visibility when eye button clicked', () => {
    render(<PasswordInput placeholder="Enter password" />)

    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Show password' })

    fireEvent.click(toggle)
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(input.type).toBe('password')
  })

  it('should not toggle when disabled', () => {
    render(<PasswordInput placeholder="Enter password" disabled />)

    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toBeDisabled()

    fireEvent.click(toggle)
    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    expect(input.type).toBe('password')
  })
})
