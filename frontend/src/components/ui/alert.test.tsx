import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('components/ui/alert', () => {
  it('should render alert with role="alert"', () => {
    render(<Alert>Message</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should apply destructive variant class', () => {
    render(<Alert variant="destructive">Error</Alert>)
    expect(screen.getByRole('alert').className).toContain('destructive')
  })

  it('should apply custom className', () => {
    render(<Alert className="custom">x</Alert>)
    expect(screen.getByRole('alert').className).toContain('custom')
  })

  it('should render AlertTitle as h5', () => {
    render(<AlertTitle>Title</AlertTitle>)
    const heading = screen.getByText('Title')
    expect(heading.tagName).toBe('H5')
  })

  it('should render AlertDescription', () => {
    render(<AlertDescription>Description text</AlertDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })
})
