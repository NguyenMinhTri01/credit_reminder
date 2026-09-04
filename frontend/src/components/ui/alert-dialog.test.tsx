import { render, screen, fireEvent } from '@testing-library/react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

describe('components/ui/alert-dialog', () => {
  it('should open dialog when trigger clicked', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )

    fireEvent.click(screen.getByText('Open'))

    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should render AlertDialogHeader with custom className', () => {
    const { container } = render(
      <AlertDialogHeader className="custom-header">x</AlertDialogHeader>,
    )
    expect(container.querySelector('div')?.className).toContain('custom-header')
  })

  it('should render AlertDialogFooter with custom className', () => {
    const { container } = render(
      <AlertDialogFooter className="custom-footer">x</AlertDialogFooter>,
    )
    expect(container.querySelector('div')?.className).toContain('custom-footer')
  })
})
