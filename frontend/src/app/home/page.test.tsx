import { render, screen } from '@testing-library/react'
import Home from '@/app/home/page'

describe('app/home/page', () => {
  it('should render the project overview card', () => {
    render(<Home />)
    expect(screen.getByText('Project Overview')).toBeInTheDocument()
    expect(screen.getByText('kiểm tra hiển thị tiếng việt')).toBeInTheDocument()
  })
})
