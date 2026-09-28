import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionForm, formatLocalIsoDate } from './transaction-form'
import type { ITransaction } from '@/shared'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const AMOUNT_LABEL = 'amount (VND)'

describe('formatLocalIsoDate', () => {
  it('preserves the local calendar date in YYYY-MM-DD format', () => {
    const localDate = new Date(2026, 8, 9, 0, 0, 0)

    expect(formatLocalIsoDate(localDate)).toBe('2026-09-09')
  })
})

describe('TransactionForm amount input', () => {
  it('groups the amount while typing and submits it as a canonical decimal string', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(<TransactionForm onSubmit={onSubmit} onCancel={jest.fn()} />)
    const amount = screen.getByLabelText(AMOUNT_LABEL)

    await user.type(amount, '200000')
    expect(amount).toHaveValue('200,000')

    await user.click(screen.getByRole('button', { name: 'create' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: '200000.00' }))
    })
  })

  it('leaves an existing amount unchanged when the field is focused and blurred', async () => {
    const user = userEvent.setup()
    const initialData = {
      id: 'tx-1',
      type: 'EXPENSE',
      amount: '200000.00',
      transactionDate: '2026-09-09',
      description: null,
      merchant: null,
    } as unknown as ITransaction

    render(
      <TransactionForm initialData={initialData} onSubmit={jest.fn()} onCancel={jest.fn()} />,
    )
    const amount = screen.getByLabelText(AMOUNT_LABEL)

    expect(amount).toHaveValue('200,000')

    await user.click(amount)
    expect(amount).toHaveValue('200,000')

    await user.tab()
    expect(amount).toHaveValue('200,000')
  })
})
