import { fireEvent, render, screen } from '@testing-library/react'
import HomeError from './error'

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

describe('home error state', () => {
  it('renders a localized alert and retries through the boundary reset', () => {
    const reset = jest.fn()
    render(<HomeError error={new Error('secret backend details')} reset={reset} />)
    expect(screen.getByRole('alert')).toHaveTextContent('loadErrorTitle')
    expect(screen.queryByText('secret backend details')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'retry' }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
