import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { BankLogo } from './bank-logo'

jest.mock('next/image', () => ({
  __esModule: true,
  // This test double intentionally renders a native image so onError can be dispatched.
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}))

describe('BankLogo', () => {
  it('resets the fallback after the bank code changes', async () => {
    const { rerender } = render(<BankLogo bankCode="unknown" bankName="Unknown" />)
    const image = screen.getByRole('img')

    fireEvent.error(image)
    expect(image).toHaveAttribute('src', '/images/banks/generic-bank.svg')

    rerender(<BankLogo bankCode="vietcombank" bankName="Vietcombank" />)

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        '/images/banks/vietcombank.svg',
      )
    })
  })
})
