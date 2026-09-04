import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'

describe('components/ui/button', () => {
  it('should render a button with default variant', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-primary')
  })

  it('should apply variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-destructive')
  })

  it('should apply size classes', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button', { name: 'Large' }).className).toContain('h-10')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button', { name: 'Custom' }).className).toContain('custom-class')
  })

  it('should render as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toHaveAttribute('href', '/test')
    expect(link.className).toContain('bg-primary')
  })

  it('should forward ref', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Button ref={ref as React.RefObject<HTMLButtonElement>}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should handle click events', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })

  it('should export buttonVariants function', () => {
    expect(typeof buttonVariants).toBe('function')
    expect(buttonVariants({ variant: 'outline' })).toContain('border')
  })
})
