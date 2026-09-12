import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { CardTypeLogo } from './card-type-logo'
import { CARD_TYPE_OPTIONS } from '@/shared/constants'

jest.mock('next/image', () => ({
  __esModule: true,
  // This test double intentionally renders a native image so onError can be dispatched.
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('CardTypeLogo', () => {
  it.each(CARD_TYPE_OPTIONS)('maps $value to its own logo', ({ value, logoPath, labelKey }) => {
    render(<CardTypeLogo cardType={value} />)

    expect(screen.getByRole('img', { name: labelKey })).toHaveAttribute('src', logoPath)
  })

  it('renders an accessible fallback for legacy or unknown card types', () => {
    const { rerender } = render(<CardTypeLogo cardType={null} />)

    expect(screen.getByRole('img', { name: 'cardTypeUnavailable' })).toBeInTheDocument()

    rerender(<CardTypeLogo cardType="DISCOVER" />)

    expect(screen.getByRole('img', { name: 'cardTypeUnavailable' })).toBeInTheDocument()
  })

  it('falls back when a known card-type logo fails to load and resets on type change', async () => {
    const { rerender } = render(<CardTypeLogo cardType="VISA" />)
    fireEvent.error(screen.getByRole('img', { name: 'cardTypes.VISA' }))

    expect(screen.getByRole('img', { name: 'cardTypeUnavailable' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'cardTypeUnavailable' })).toHaveAttribute(
      'data-fallback',
      'true',
    )

    rerender(<CardTypeLogo cardType="JCB" />)

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'cardTypes.JCB' })).toHaveAttribute(
        'src',
        '/images/card-types/jcb.svg',
      )
    })
  })
})
