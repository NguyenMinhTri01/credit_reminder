import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { CardForm, computeNextDue, parseExpiryRaw } from './card-form'
import { CARD_TYPE_OPTIONS } from '@/shared/constants'

jest.mock('next/image', () => ({
  __esModule: true,
  // This test double renders native images so selector branding can be asserted.
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}))

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

jest.mock('@/hooks/use-card-schedule-config', () => ({
  useCardScheduleConfig: () => ({ timeZone: 'Asia/Ho_Chi_Minh' }),
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
          cardType: 'VISA',
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

    expect(screen.getByText('20/09/2026')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('formStatementDay'), {
      target: { value: '10' },
    })

    expect(screen.getByText('25/09/2026')).toBeInTheDocument()
  })

  it('uses the configured application timezone when an instant crosses a calendar-day boundary', () => {
    const fixedInstant = new Date('2026-09-06T20:00:00.000Z')

    const resultHCM = computeNextDue(5, 1, fixedInstant, 'Asia/Ho_Chi_Minh')
    const resultUTC = computeNextDue(5, 1, fixedInstant, 'UTC')

    expect(resultHCM).toBe('2026-10-06')
    expect(resultUTC).toBe('2026-09-06')
  })

  it('uses the most recent statement cycle when the current statement date is still ahead', () => {
    const result = computeNextDue(20, 20, new Date('2026-09-05T05:00:00.000Z'))

    expect(result).toBe('2026-09-09')
  })

  it('accepts only calendar-valid expiry months when parsing MM/YY', () => {
    expect(parseExpiryRaw('09/28')).toEqual({ expiryMonth: 9, expiryYear: 2028 })
    expect(parseExpiryRaw('00/28')).toEqual({})
    expect(parseExpiryRaw('13/28')).toEqual({})
    expect(parseExpiryRaw('9/28')).toEqual({})
  })

  it('renders exactly one bank logo and compact short name in the select trigger', () => {
    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardType: 'VISA',
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

    const trigger = screen.getByRole('combobox', { name: 'formBankSelection' })
    const logosInTrigger = trigger.querySelectorAll('[data-testid="bank-logo"]')
    expect(logosInTrigger.length).toBe(1)
    expect(trigger).toHaveTextContent('Vietcombank')
  })

  it('offers exactly the five supported card types', () => {
    render(<CardForm onSubmit={jest.fn()} isLoading={false} />)

    fireEvent.click(screen.getByRole('combobox', { name: 'formCardType' }))

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(5)
    expect(options.map((option) => option.textContent)).toEqual([
      'cardTypes.VISA',
      'cardTypes.MASTERCARD',
      'cardTypes.AMERICAN_EXPRESS',
      'cardTypes.JCB',
      'cardTypes.NAPAS',
    ])
  })

  it('shows the selected card-type logo in the trigger and each option', () => {
    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardType: 'VISA',
          lastFourDigits: '1234',
          creditLimit: '50000000.00',
          availableCredit: '35000000.00',
          statementDay: 15,
          paymentDueDaysAfterStatement: 20,
        }}
        onSubmit={jest.fn()}
        isLoading={false}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'formCardType' })
    expect(within(trigger).getByRole('img', { name: 'cardTypes.VISA' })).toHaveAttribute(
      'src',
      '/images/card-types/visa.svg',
    )

    fireEvent.click(trigger)

    const options = screen.getAllByRole('option')
    CARD_TYPE_OPTIONS.forEach((option, index) => {
      expect(within(options[index]).getByRole('img', { name: option.labelKey })).toHaveAttribute(
        'src',
        option.logoPath,
      )
    })
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
          cardType: 'VISA',
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
          cardType: 'VISA',
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

  it('requires a card type when creating a card', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          lastFourDigits: '1234',
          creditLimit: '50000000.00',
          availableCredit: '35000000.00',
          statementDay: 15,
          paymentDueDaysAfterStatement: 20,
        }}
        onSubmit={onSubmit}
        isLoading={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'addCard' }))

    await waitFor(() => {
      expect(screen.getByText('validationCardTypeRequired')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects an unsupported runtime card type', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          // Simulate stale API data reaching the form despite the typed payload contract.
          cardType: 'DISCOVER' as never,
          lastFourDigits: '1234',
          creditLimit: '50000000.00',
          availableCredit: '35000000.00',
          statementDay: 15,
          paymentDueDaysAfterStatement: 20,
        }}
        onSubmit={onSubmit}
        isLoading={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'addCard' }))

    await waitFor(() => {
      expect(screen.getByText('validationCardTypeInvalid')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
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

  it('allows metadata-only edits for a legacy card with unknown limit and schedule', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Legacy Visa',
          lastFourDigits: '1234',
        }}
        onSubmit={onSubmit}
        isLoading={false}
        isEdit
        submitLabel="editCard"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'editCard' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          creditLimit: '',
          statementDay: undefined,
          paymentDueDaysAfterStatement: undefined,
        }),
      )
    })
  })

  it('rejects clearing creditLimit when the original card had a value', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Visa',
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

    // Clear the credit limit field
    fireEvent.change(screen.getByLabelText('formCreditLimit'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'editCard' }))

    await waitFor(() => {
      expect(screen.getByText('validationCreditLimitPositive')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects clearing statementDay and paymentDueDaysAfterStatement when the original card had values', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <CardForm
        defaultValues={{
          bankCode: 'vietcombank',
          cardName: 'Visa',
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

    // Clear both schedule fields
    fireEvent.change(screen.getByLabelText('formStatementDay'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('formPaymentDueDays'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'editCard' }))

    await waitFor(() => {
      expect(screen.getAllByText('validationStatementDayRequired').length).toBeGreaterThan(0)
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
