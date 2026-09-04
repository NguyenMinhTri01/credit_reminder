import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/ui/checkbox'

describe('components/ui/checkbox', () => {
  it('should render a checkbox role', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Checkbox className="custom" />)
    expect(screen.getByRole('checkbox').className).toContain('custom')
  })

  it('should handle checked state change', () => {
    render(<Checkbox />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    // Radix checkbox toggles data-state
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('should be disabled when disabled prop is set', () => {
    render(<Checkbox disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
