import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

describe('components/ui/table', () => {
  it('should render a full table structure', () => {
    render(
      <Table>
        <TableCaption>Caption text</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header A</TableHead>
            <TableHead>Header B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell 1</TableCell>
            <TableCell>Cell 2</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
            <TableCell>Footer 2</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )
    expect(screen.getByText('Caption text').tagName).toBe('CAPTION')
    expect(screen.getByText('Header A').tagName).toBe('TH')
    expect(screen.getByText('Cell 1').tagName).toBe('TD')
    expect(screen.getByText('Footer').tagName).toBe('TD')
  })

  it('should apply custom className to Table', () => {
    render(<Table className="custom-table"><tbody /></Table>)
    expect(screen.getByRole('table').className).toContain('custom-table')
  })

  it('should apply custom className to TableHeader', () => {
    const { container } = render(<TableHeader className="custom-th" />)
    expect(container.querySelector('thead')?.className).toContain('custom-th')
  })

  it('should apply custom className to TableBody', () => {
    const { container } = render(<TableBody className="custom-tb" />)
    expect(container.querySelector('tbody')?.className).toContain('custom-tb')
  })

  it('should apply custom className to TableRow', () => {
    const { container } = render(<TableRow className="custom-tr" />)
    expect(container.querySelector('tr')?.className).toContain('custom-tr')
  })

  it('should apply custom className to TableHead', () => {
    const { container } = render(<TableHead className="custom-th-cell" />)
    expect(container.querySelector('th')?.className).toContain('custom-th-cell')
  })

  it('should apply custom className to TableCell', () => {
    const { container } = render(<TableCell className="custom-td" />)
    expect(container.querySelector('td')?.className).toContain('custom-td')
  })
})
