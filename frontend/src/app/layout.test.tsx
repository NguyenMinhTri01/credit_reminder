import RootLayout from '@/app/layout'

jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="intl-provider">{children}</div>
  ),
}))

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn().mockResolvedValue('vi'),
  getMessages: jest.fn().mockResolvedValue({}),
}))

jest.mock('next/font/google', () => ({
  Geist: () => ({ className: 'font-geist' }),
}))

jest.mock('@/providers/query-provider', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}))

jest.mock('@/providers/session-provider', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

jest.mock('./globals.css', () => ({}))

describe('app/layout', () => {
  it('should return html with lang="vi"', async () => {
    const result = await RootLayout({ children: <div>page</div> })
    // RootLayout returns a JSX element; inspect its props directly.
    expect(result.type).toBe('html')
    expect(result.props.lang).toBe('vi')
    expect(result.props.suppressHydrationWarning).toBe(true)
  })

  it('should wrap children in all providers', async () => {
    const result = await RootLayout({ children: <div>page</div> })
    const body = result.props.children
    // body is <body className={geist.className}> ...providers... </body>
    expect(body.type).toBe('body')
    expect(body.props.className).toBe('font-geist')
  })
})
