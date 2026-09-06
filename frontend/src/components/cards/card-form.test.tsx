import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CardForm } from './card-form'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
}))

jest.mock('@/hooks/use-bank-catalog', () => ({
  useBankCatalog: () => ({
    banks: [
      {
        bankCode: 'vietcombank',
        name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        shortName: 'Vietcombank',
        logoPath: '/images/banks/vietcombank.svg',
        category: 'state-owned',
      },
    ],
    isLoading: false,
    error: null,
  }),
}))

jest.mock('@/components/cards/bank-logo', () => ({
  BankLogo: ({ bankName }: { bankName: string | null }) => (
    <span data-testid="bank-logo">{bankName}</span>
  ),
}))

describe('CardForm', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-09-04T05:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('updates the next due date preview when schedule fields change', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Platinum',
          lastFourDigits: '1234',
          creditLimit: '50000000',
          availableCredit: '40000000',
          statementDay: 5,
          paymentDueDaysAfterStatement: 15,
        }}
        onSubmit={onSubmit}
        isLoading={false}
      />,
    )

    expect(screen.getByText('19/09/2026')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('formStatementDay'), {
      target: { value: '10' },
    })

    expect(screen.getByText('24/09/2026')).toBeInTheDocument()
  })

  it('renders exactly one bank logo and compact short name in the select trigger', () => {
    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Platinum',
          lastFourDigits: '1234',
          creditLimit: '50000000',
          availableCredit: '40000000',
          statementDay: 5,
          paymentDueDaysAfterStatement: 15,
        }}
        onSubmit={jest.fn()}
        isLoading={false}
      />,
    )

    const trigger = screen.getByRole('combobox')
    const logosInTrigger = trigger.querySelectorAll('[data-testid="bank-logo"]')
    expect(logosInTrigger.length).toBe(1)
    expect(trigger).toHaveTextContent('Vietcombank')
  })

  it('sanitizes lastFourDigits to allow only 4 ASCII digits and preserves leading zeros', () => {
    render(<CardForm onSubmit={jest.fn()} isLoading={false} />)

    const lastFourInput = screen.getByLabelText('formLastFourDigits')

    // Valid leading zeros
    fireEvent.change(lastFourInput, { target: { value: '0012' } })
    expect(lastFourInput).toHaveValue('0012')

    // Strips letters and special characters immediately
    fireEvent.change(lastFourInput, { target: { value: '12a4' } })
    expect(lastFourInput).toHaveValue('124')

    // Cuts off fifth digit
    fireEvent.change(lastFourInput, { target: { value: '12345' } })
    expect(lastFourInput).toHaveValue('1234')
  })

  it('formats money inputs to presentation standard and submits canonical decimal strings', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Platinum',
          lastFourDigits: '0012',
          statementDay: 20,
          paymentDueDaysAfterStatement: 20,
        }}
        onSubmit={onSubmit}
        isLoading={false}
      />,
    )

    const creditLimitInput = screen.getByLabelText('formCreditLimit')
    const availableCreditInput = screen.getByLabelText('formAvailableCredit')

    // User types 400000
    fireEvent.change(creditLimitInput, { target: { value: '400000' } })
    expect(creditLimitInput).toHaveValue('400,000.00đ')

    fireEvent.change(availableCreditInput, { target: { value: '400000' } })
    expect(availableCreditInput).toHaveValue('400,000.00đ')

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'addCard' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          bankCode: 'vietcombank',
          lastFourDigits: '0012',
          creditLimit: '400000.00',
          availableCredit: '400000.00',
        }),
      )
    })
  })

  it('formats defaultValues from API decimal strings to presentation VND', () => {
    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Visa',
          lastFourDigits: '9999',
          creditLimit: '50000000.00',
          availableCredit: '35000000.00',
          statementDay: 15,
          paymentDueDaysAfterStatement: 25,
        }}
        onSubmit={jest.fn()}
        isLoading={false}
      />,
    )

    expect(screen.getByLabelText('formCreditLimit')).toHaveValue('50,000,000.00đ')
    expect(screen.getByLabelText('formAvailableCredit')).toHaveValue('35,000,000.00đ')
  })

  it('submits edit mode when a legacy card has no available credit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Legacy Visa',
          lastFourDigits: '1234',
          creditLimit: '50000000.00',
          statementDay: 15,
          paymentDueDaysAfterStatement: 20,
        }}
        onSubmit={onSubmit}
        isLoading={false}
        isEdit
        submitLabel="editCard"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'editCard' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })
})
