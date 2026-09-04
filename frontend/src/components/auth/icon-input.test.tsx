import { render, screen } from '@testing-library/react'
import { forwardRef } from 'react'
import { IconInput } from '@/components/auth/icon-input'
import { Mail } from 'lucide-react'

describe('components/auth/icon-input', () => {
  it('should render input with placeholder', () => {
    render(<IconInput icon={Mail} placeholder="Enter email" />)

    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('should forward ref to input element', () => {
    const ref = { current: null as HTMLInputElement | null }

    const TestComponent = forwardRef<HTMLInputElement>((_, ref) => (
      <IconInput ref={ref} icon={Mail} placeholder="x" />
    ))
    TestComponent.displayName = 'TestComponent'

    render(<TestComponent ref={ref as React.RefObject<HTMLInputElement>} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should pass through input props', () => {
    render(<IconInput icon={Mail} placeholder="x" aria-label="email-field" />)

    expect(screen.getByLabelText('email-field')).toBeInTheDocument()
  })
})
