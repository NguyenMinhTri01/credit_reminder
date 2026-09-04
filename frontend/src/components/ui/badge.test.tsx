import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '@/components/ui/badge'

describe('components/ui/badge', () => {
  it('should render a div with badge content', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge.tagName).toBe('DIV')
  })

  it('should apply default variant class', () => {
    render(<Badge>x</Badge>)
    expect(screen.getByText('x').className).toContain('bg-primary')
  })

  it('should apply secondary variant class', () => {
    render(<Badge variant="secondary">x</Badge>)
    expect(screen.getByText('x').className).toContain('bg-secondary')
  })

  it('should apply destructive variant class', () => {
    render(<Badge variant="destructive">x</Badge>)
    expect(screen.getByText('x').className).toContain('bg-destructive')
  })

  it('should apply outline variant class', () => {
    render(<Badge variant="outline">x</Badge>)
    expect(screen.getByText('x').className).toContain('text-foreground')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom">x</Badge>)
    expect(screen.getByText('x').className).toContain('custom')
  })

  it('should export badgeVariants function', () => {
    expect(typeof badgeVariants).toBe('function')
  })
})
