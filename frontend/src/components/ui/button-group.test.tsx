import { render, screen } from '@testing-library/react'
import { ButtonGroup, ButtonGroupText, ButtonGroupSeparator, buttonGroupVariants } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

describe('components/ui/button-group', () => {
  it('should render a group with role="group"', () => {
    render(
      <ButtonGroup>
        <Button>A</Button>
        <Button>B</Button>
      </ButtonGroup>,
    )
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('should apply default horizontal orientation classes', () => {
    render(<ButtonGroup>x</ButtonGroup>)
    // When orientation is undefined, data-orientation is undefined too.
    // The horizontal CSS classes are applied via CVA defaultVariants.
    expect(screen.getByRole('group').className).toContain('rounded-l-none')
  })

  it('should support vertical orientation', () => {
    render(<ButtonGroup orientation="vertical">x</ButtonGroup>)
    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('should apply custom className', () => {
    render(<ButtonGroup className="custom">x</ButtonGroup>)
    expect(screen.getByRole('group').className).toContain('custom')
  })

  it('should render ButtonGroupText as div by default', () => {
    render(<ButtonGroupText>Label</ButtonGroupText>)
    expect(screen.getByText('Label').tagName).toBe('DIV')
  })

  it('should render ButtonGroupText as child when asChild', () => {
    render(
      <ButtonGroupText asChild>
        <span>Span Label</span>
      </ButtonGroupText>,
    )
    expect(screen.getByText('Span Label').tagName).toBe('SPAN')
  })

  it('should render ButtonGroupSeparator element', () => {
    const { container } = render(<ButtonGroupSeparator />)
    // Radix Separator with decorative=true has aria-hidden, no role.
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render ButtonGroupSeparator with vertical orientation by default', () => {
    const { container } = render(<ButtonGroupSeparator />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('should compose a full button group with input', () => {
    render(
      <ButtonGroup>
        <Button>Go</Button>
        <Input placeholder="search" />
      </ButtonGroup>,
    )
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('should export buttonGroupVariants function', () => {
    expect(typeof buttonGroupVariants).toBe('function')
  })
})
