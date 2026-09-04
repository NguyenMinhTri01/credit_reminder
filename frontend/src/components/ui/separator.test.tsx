import { render } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('components/ui/separator', () => {
  it('should render a separator element', () => {
    const { container } = render(<Separator />)
    // Radix Separator renders a div with role="separator" only when decorative=false.
    // When decorative=true (default), it has aria-hidden. Query by the rendered element.
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should default to horizontal orientation', () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('should support vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('should apply custom className', () => {
    const { container } = render(<Separator className="custom" />)
    expect((container.firstChild as HTMLElement).className).toContain('custom')
  })
})
