import { render, screen } from '@testing-library/react'
import HomeLoading from './loading'

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

describe('home loading state', () => {
  it('renders structural skeletons without fake financial data', () => {
    render(<HomeLoading />)
    expect(screen.getByLabelText('loading')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('summary-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('cards-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('reminders-skeleton')).toBeInTheDocument()
    expect(screen.queryByText(/₫/)).not.toBeInTheDocument()
  })
})
