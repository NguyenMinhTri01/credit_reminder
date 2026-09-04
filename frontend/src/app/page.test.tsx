import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('app/page', () => {
  it('should render the project overview card', () => {
    render(<Home />)
    expect(screen.getByText('Project Overview')).toBeInTheDocument()
    expect(screen.getByText(/Track progress/)).toBeInTheDocument()
  })
})
