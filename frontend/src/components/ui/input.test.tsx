import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('components/ui/input', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type here').tagName).toBe('INPUT')
  })

  it('should apply custom className', () => {
    render(<Input className="custom-input" placeholder="x" />)
    expect(screen.getByPlaceholderText('x').className).toContain('custom-input')
  })

  it('should pass through type attribute', () => {
    render(<Input type="email" placeholder="x" />)
    expect(screen.getByPlaceholderText('x')).toHaveAttribute('type', 'email')
  })

  it('should handle user input', () => {
    render(<Input placeholder="x" />)
    const input = screen.getByPlaceholderText('x') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(input.value).toBe('hello')
  })

  it('should forward ref', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref as React.RefObject<HTMLInputElement>} placeholder="x" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should be disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="x" />)
    expect(screen.getByPlaceholderText('x')).toBeDisabled()
  })
})
