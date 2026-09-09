import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReconcileForm } from './reconcile-form'
import type { ICreditCard } from '@/shared'

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: () => (key: string) => key,
}))

const card = {
  id: 'card-1',
  availableCredit: '50000000.00',
} as ICreditCard

describe('ReconcileForm', () => {
  it('rejects negative zero before sending it to the API', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(<ReconcileForm card={card} onSubmit={onSubmit} onCancel={jest.fn()} />)

    fireEvent.change(screen.getByLabelText('newAvailableCredit (VND)'), {
      target: { value: '-0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'reconcile' }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
      expect(screen.getByText('validationAvailableCreditNonNegative')).toBeInTheDocument()
    })
  })
})
