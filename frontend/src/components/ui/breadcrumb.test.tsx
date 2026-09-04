import { render, screen } from '@testing-library/react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb'

describe('components/ui/breadcrumb', () => {
  it('should render a breadcrumb nav', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'breadcrumb')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    expect(screen.getByText('Current')).toHaveAttribute('aria-current', 'page')
  })

  it('should render BreadcrumbLink as child when asChild', () => {
    render(
      <BreadcrumbLink asChild>
        <a href="/x">Custom</a>
      </BreadcrumbLink>,
    )
    expect(screen.getByRole('link', { name: 'Custom' })).toHaveAttribute('href', '/x')
  })

  it('should render BreadcrumbSeparator with chevron by default', () => {
    const { container } = render(<BreadcrumbSeparator />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render BreadcrumbSeparator with custom children', () => {
    render(<BreadcrumbSeparator>/</BreadcrumbSeparator>)
    expect(screen.getByText('/')).toBeInTheDocument()
  })

  it('should render BreadcrumbEllipsis with More sr-only text', () => {
    render(<BreadcrumbEllipsis />)
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('should apply custom className to BreadcrumbList', () => {
    const { container } = render(<BreadcrumbList className="custom-list" />)
    expect(container.querySelector('ol')?.className).toContain('custom-list')
  })

  it('should apply custom className to BreadcrumbItem', () => {
    const { container } = render(<BreadcrumbItem className="custom-item" />)
    expect(container.querySelector('li')?.className).toContain('custom-item')
  })
})
