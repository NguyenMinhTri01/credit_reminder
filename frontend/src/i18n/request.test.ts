import getRequestConfig from '@/i18n/request'

jest.mock('next-intl/server', () => ({
  getRequestConfig: (fn: (args: unknown) => unknown) => fn,
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: (name: string) => (name === 'locale' ? { value: 'en' } : undefined),
  }),
}))

// Mock the dynamic message imports.
jest.mock('../messages/vi.json', () => ({ default: { hello: 'Xin chào' } }), { virtual: true })
jest.mock('../messages/en.json', () => ({ default: { hello: 'Hello' } }), { virtual: true })

describe('i18n/request', () => {
  it('should export locales and defaultLocale', async () => {
    const mod = await import('@/i18n/request')
    expect(mod.locales).toEqual(['vi', 'en'])
    expect(mod.defaultLocale).toBe('vi')
  })

  it('should resolve locale from cookie', async () => {
    const config = (await getRequestConfig({} as never)) as { locale: string }
    expect(config.locale).toBe('en')
  })

  it('should fall back to defaultLocale when no cookie', async () => {
    const { cookies } = jest.requireMock('next/headers')
    cookies.mockResolvedValueOnce({ get: () => undefined })

    const config = (await getRequestConfig({} as never)) as { locale: string }
    expect(config.locale).toBe('vi')
  })

  it('should load messages for the resolved locale', async () => {
    const config = (await getRequestConfig({} as never)) as { messages: unknown }
    expect(config.messages).toBeDefined()
    expect(typeof config.messages).toBe('object')
  })
})
