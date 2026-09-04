import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('components/ui/card', () => {
  it('should render Card with children', () => {
    render(<Card>card content</Card>)
    expect(screen.getByText('card content')).toBeInTheDocument()
  })

  it('should apply custom className to Card', () => {
    render(<Card className="custom-card">x</Card>)
    expect(screen.getByText('x').className).toContain('custom-card')
  })

  it('should render CardHeader', () => {
    render(<CardHeader>header</CardHeader>)
    expect(screen.getByText('header')).toBeInTheDocument()
  })

  it('should render CardTitle as h3', () => {
    render(<CardTitle>My Title</CardTitle>)
    const heading = screen.getByText('My Title')
    expect(heading.tagName).toBe('H3')
  })

  it('should render CardDescription as p', () => {
    render(<CardDescription>A description</CardDescription>)
    expect(screen.getByText('A description').tagName).toBe('P')
  })

  it('should render CardContent', () => {
    render(<CardContent>content</CardContent>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('should render CardFooter', () => {
    render(<CardFooter>footer</CardFooter>)
    expect(screen.getByText('footer')).toBeInTheDocument()
  })

  it('should compose a full card', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Foot')).toBeInTheDocument()
  })
})
