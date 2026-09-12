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

  it('honors compact dimensions for a known card type', () => {
    render(<CardTypeLogo cardType="VISA" size={20} />)

    expect(screen.getByRole('img', { name: 'cardTypes.VISA' })).toHaveStyle({
      width: '20px',
      height: '13px',
    })
  })

  it('honors compact dimensions and bounds the fallback icon', () => {
    render(<CardTypeLogo cardType="DISCOVER" size={20} />)

    const fallback = screen.getByRole('img', { name: 'cardTypeUnavailable' })
    expect(fallback).toHaveStyle({ width: '20px', height: '13px' })
    expect(fallback.querySelector('svg')).toHaveAttribute('width', '13')
    expect(fallback.querySelector('svg')).toHaveAttribute('height', '13')
  })

  it('keeps the default dimensions', () => {
    render(<CardTypeLogo cardType="VISA" />)

    expect(screen.getByRole('img', { name: 'cardTypes.VISA' })).toHaveStyle({
      width: '32px',
      height: '20px',
    })
  })

  it('falls back when a known card-type logo fails to load and resets on type change', async () => {
    const { rerender } = render(<CardTypeLogo cardType="VISA" size={20} />)
    fireEvent.error(screen.getByRole('img', { name: 'cardTypes.VISA' }))

    const fallback = screen.getByRole('img', { name: 'cardTypeUnavailable' })
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveAttribute('data-fallback', 'true')
    expect(fallback).toHaveStyle({ width: '20px', height: '13px' })

    rerender(<CardTypeLogo cardType="JCB" />)

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'cardTypes.JCB' })).toHaveAttribute(
        'src',
        '/images/card-types/jcb.svg',
      )
    })
  })
})
