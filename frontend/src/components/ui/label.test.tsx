import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('components/ui/label', () => {
  it('should render a label element', () => {
    render(<Label htmlFor="x">Email</Label>)
    const label = screen.getByText('Email')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveAttribute('for', 'x')
  })

  it('should apply custom className', () => {
    render(<Label className="custom">x</Label>)
    expect(screen.getByText('x').className).toContain('custom')
  })

  it('should forward ref', () => {
    const ref = { current: null as HTMLLabelElement | null }
    render(<Label ref={ref as React.RefObject<HTMLLabelElement>}>x</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })
})
