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
  it('hydrates the stored balance as a whole-đồng amount', () => {
    render(<ReconcileForm card={card} onSubmit={jest.fn()} onCancel={jest.fn()} />)

    expect(screen.getByLabelText('newAvailableCredit (VND)')).toHaveValue('50,000,000')
  })

  it('reconciles an untouched balance without changing it', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(<ReconcileForm card={card} onSubmit={onSubmit} onCancel={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'reconcile' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ availableCredit: '50000000.00' })
    })
  })

  it('reconciles an unchanged hydrated negative balance', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <ReconcileForm
        card={{ ...card, availableCredit: '-2500000.00' }}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'reconcile' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ availableCredit: '-2500000.00' })
    })
  })

  it('never sends a negative amount to the API, because a sign cannot be entered', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(<ReconcileForm card={card} onSubmit={onSubmit} onCancel={jest.fn()} />)

    const input = screen.getByLabelText('newAvailableCredit (VND)')
    fireEvent.change(input, { target: { value: '-0' } })
    expect(input).toHaveValue('0')

    fireEvent.change(input, { target: { value: '-5000' } })
    expect(input).toHaveValue('5,000')

    fireEvent.click(screen.getByRole('button', { name: 'reconcile' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ availableCredit: '5000.00' })
    })
  })
})
