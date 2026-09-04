import { render, screen } from '@testing-library/react'
import { Calendar } from '@/components/ui/calendar'

describe('components/ui/calendar', () => {
  it('should render a calendar with navigation buttons', () => {
    render(<Calendar mode="single" />)
    // DayPicker renders a grid with role="grid"
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Calendar className="custom-cal" mode="single" />)
    expect(container.querySelector('[data-slot="calendar"]')?.className).toContain('custom-cal')
  })

  it('should render with selected date', () => {
    render(<Calendar mode="single" selected={new Date('2026-01-15')} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('should render with dropdown caption layout', () => {
    render(<Calendar mode="single" captionLayout="dropdown" />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('should render with custom buttonVariant', () => {
    render(<Calendar mode="single" buttonVariant="outline" />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('should render with custom classNames override', () => {
    const { container } = render(
      <Calendar mode="single" classNames={{ root: 'custom-root' }} />,
    )
    expect(container.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
  })

  it('should render with custom components override', () => {
    render(
      <Calendar
        mode="single"
        components={{
          Chevron: () => <span data-testid="custom-chevron" />,
        }}
      />,
    )
    // Custom Chevron replaces the default one; multiple chevrons render (nav buttons).
    expect(screen.getAllByTestId('custom-chevron').length).toBeGreaterThan(0)
  })
})
