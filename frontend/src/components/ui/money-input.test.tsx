import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MoneyInput } from './money-input'

function Harness({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  return (
    <>
      <label htmlFor="money">Amount</label>
      <MoneyInput id="money" value={value} onValueChange={setValue} />
    </>
  )
}

function renderMoneyInput(initialValue?: string) {
  const user = userEvent.setup()
  render(<Harness initialValue={initialValue} />)
  return { user, input: screen.getByLabelText('Amount') as HTMLInputElement }
}

describe('MoneyInput', () => {
  it('renders a labelled numeric field with the currency symbol beside it', () => {
    const { input } = renderMoneyInput()

    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(screen.getByText('đ')).toBeInTheDocument()
  })

  it('keeps the currency symbol out of the editable value', async () => {
    const { user, input } = renderMoneyInput()

    await user.type(input, '400000')

    expect(input).toHaveValue('400,000')
  })

  it('groups the value on every keystroke without ever emptying it', async () => {
    const { user, input } = renderMoneyInput()
    const steps: [string, string][] = [
      ['4', '4'],
      ['0', '40'],
      ['0', '400'],
      ['0', '4,000'],
      ['0', '40,000'],
      ['0', '400,000'],
    ]

    for (const [key, expected] of steps) {
      await user.type(input, key)
      expect(input).toHaveValue(expected)
    }
  })

  it('keeps the caret after the digit typed in the middle of the value', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, '5', { initialSelectionStart: 1, initialSelectionEnd: 1 })

    expect(input).toHaveValue('4,500,000')
    expect(input.selectionStart).toBe(3)
  })

  it('deletes the preceding digit when Backspace is pressed on a group separator', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, '{Backspace}', { initialSelectionStart: 4, initialSelectionEnd: 4 })

    expect(input).toHaveValue('40,000')
    expect(input.selectionStart).toBe(2)
  })

  it('deletes the following digit when Delete is pressed on a group separator', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, '{Delete}', { initialSelectionStart: 3, initialSelectionEnd: 3 })

    expect(input).toHaveValue('40,000')
    expect(input.selectionStart).toBe(4)
  })

  it('deletes a leading minus without deleting the first amount digit', async () => {
    const { user, input } = renderMoneyInput('-2,500')

    await user.type(input, '{Delete}', { initialSelectionStart: 0, initialSelectionEnd: 0 })

    expect(input).toHaveValue('2,500')
  })

  it('deletes a digit normally when Backspace is not aimed at a separator', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, '{Backspace}')

    expect(input).toHaveValue('40,000')
  })

  it('ignores characters that are not part of an amount', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, 'a')
    await user.type(input, '.')
    await user.type(input, 'đ')

    expect(input).toHaveValue('400,000')
  })

  it('keeps an amount when a selected value is replaced with invalid text', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.type(input, 'x', { initialSelectionStart: 0, initialSelectionEnd: 7 })

    expect(input).toHaveValue('400,000')
  })

  it('refuses a typed minus sign so a negative amount cannot be entered', async () => {
    const { user, input } = renderMoneyInput()

    await user.type(input, '-5000')

    expect(input).toHaveValue('5,000')
  })

  it('keeps the sign of a negative stored amount until the field is edited', async () => {
    const { user, input } = renderMoneyInput('-2,500,000')

    expect(input).toHaveValue('-2,500,000')

    await user.type(input, '0')

    expect(input).toHaveValue('25,000,000')
  })

  it('preserves a negative stored sign when ignored edits do not change amount digits', async () => {
    const { user, input } = renderMoneyInput('-2,500')

    await user.type(input, 'a')
    await user.type(input, '.')
    await user.type(input, 'đ')

    expect(input).toHaveValue('-2,500')
  })

  it('rounds a pasted amount that carries cents into whole đồng', async () => {
    const { user, input } = renderMoneyInput()

    await user.click(input)
    await user.paste('400,000.00đ')

    expect(input).toHaveValue('400,000')
  })

  it('reads a pasted dot-grouped amount as grouping rather than a fraction', async () => {
    const { user, input } = renderMoneyInput()

    await user.click(input)
    await user.paste('1.234.567')

    expect(input).toHaveValue('1,234,567')
  })

  it('becomes empty rather than zero when the whole value is deleted', async () => {
    const { user, input } = renderMoneyInput('400,000')

    await user.clear(input)

    expect(input).toHaveValue('')
  })

  it('rejects a keystroke that would exceed the storable integer digits', async () => {
    const { user, input } = renderMoneyInput('1,234,567,890,123')

    await user.type(input, '4')

    expect(input).toHaveValue('1,234,567,890,123')
  })

  it('rejects an over-wide keystroke typed in the middle without rewriting other digits', async () => {
    const { user, input } = renderMoneyInput('1,234,567,890,123')

    await user.type(input, '9', { initialSelectionStart: 1, initialSelectionEnd: 1 })

    expect(input).toHaveValue('1,234,567,890,123')
  })

  it('restores the caret after rejecting a multi-digit over-wide paste', async () => {
    const { user, input } = renderMoneyInput('1,234,567,890,123')
    await user.click(input)
    input.setSelectionRange(1, 1)

    await user.paste('99')

    expect(input).toHaveValue('1,234,567,890,123')
    expect(input.selectionStart).toBe(1)
  })

  it('dims the currency symbol together with a disabled field', () => {
    render(<MoneyInput aria-label="Amount" value="400,000" onValueChange={jest.fn()} disabled />)

    expect(screen.getByLabelText('Amount')).toBeDisabled()
    expect(screen.getByText('đ')).toHaveClass('opacity-50')
  })
})
