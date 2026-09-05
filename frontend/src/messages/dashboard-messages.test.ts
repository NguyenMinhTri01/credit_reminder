import en from './en.json'
import vi from './vi.json'

function leafKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('dashboard messages', () => {
  it('keeps Vietnamese and English keys aligned', () => {
    expect(leafKeys(vi.dashboard).sort()).toEqual(leafKeys(en.dashboard).sort())
    expect(leafKeys(vi.navigation).sort()).toEqual(leafKeys(en.navigation).sort())
  })
})
