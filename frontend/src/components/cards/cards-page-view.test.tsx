import { fireEvent, render, screen } from '@testing-library/react'
import { CardsPageView } from './cards-page-view'
import type { ICreditCard } from '@/shared'

const mockUseCardList = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/hooks/use-credit-cards', () => ({
  useCardList: (...args: unknown[]) => mockUseCardList(...args),
}))

jest.mock('@/components/cards/add-card-sheet', () => ({
  AddCardSheet: () => null,
}))

jest.mock('@/components/cards/card-tile', () => ({
  CardTile: ({
    card,
    onViewDetail,
  }: {
    card: ICreditCard
    onViewDetail?: (card: ICreditCard) => void
  }) => (
    <button type="button" onClick={() => onViewDetail?.(card)}>
      {card.cardName}
    </button>
  ),
}))

jest.mock('@/components/cards/card-detail-view', () => ({
  CardDetailView: ({ card }: { card: ICreditCard }) => <div>{card.cardName}</div>,
}))

const card = { id: 'card-1', cardName: 'Original' } as ICreditCard

describe('CardsPageView', () => {
  beforeEach(() => {
    mockUseCardList.mockReset()
  })

  it('shows a retry action when loading cards fails', () => {
    const refetch = jest.fn()
    mockUseCardList.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch,
    })

    render(<CardsPageView initialCards={[]} />)

    expect(screen.getByText('loadErrorTitle')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('noCardsTitle')).not.toBeInTheDocument()
  })

  it('derives the open detail view from the latest card collection', () => {
    let currentCards = [card]
    mockUseCardList.mockImplementation(() => ({
      data: currentCards,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    }))

    const { rerender } = render(<CardsPageView initialCards={currentCards} />)
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))

    currentCards = [{ ...card, cardName: 'Updated' }]
    rerender(<CardsPageView initialCards={currentCards} />)

    expect(screen.getAllByText('Updated')).toHaveLength(2)
  })
})
