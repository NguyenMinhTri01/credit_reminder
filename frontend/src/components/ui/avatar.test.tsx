import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

describe('components/ui/avatar', () => {
  it('should render Avatar with fallback', () => {
    render(
      <Avatar>
        <AvatarImage src="http://example.com/x.png" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should apply custom className to Avatar', () => {
    const { container } = render(<Avatar className="custom">x</Avatar>)
    // Avatar renders a span (Radix Root) wrapping children
    const avatarRoot = container.querySelector('.custom')
    expect(avatarRoot).toBeInTheDocument()
  })

  it('should apply custom className to AvatarFallback', () => {
    render(
      <Avatar>
        <AvatarFallback className="custom-fb">FB</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText('FB').className).toContain('custom-fb')
  })
})
