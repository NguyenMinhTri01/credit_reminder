import proxyDefault from '@/proxy'

// Cast proxy to a single-arg callable to match our mock signature.
type ProxyHandler = (req: {
  auth: unknown
  nextUrl: { pathname: string; search: string; origin: string; toString(): string }
}) => unknown
const proxy = proxyDefault as unknown as ProxyHandler

// Mock auth() wrapper so we can control req.auth per test.
jest.mock('@/lib/auth', () => ({
  auth: (handler: (req: { auth: unknown; nextUrl: { pathname: string; search: string } }) => unknown) => {
    return (req: { auth: unknown; nextUrl: { pathname: string; search: string } }) => handler(req)
  },
}))

// Mock NextResponse to avoid pulling in next/server (which needs Request polyfill).
jest.mock('next/server', () => {
  class MockResponse {
    status: number
    headers: Map<string, string>
    constructor(_body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.status = init?.status ?? 200
      this.headers = new Map(Object.entries(init?.headers ?? {}))
    }
  }
  const NextResponse = Object.assign(MockResponse, {
    redirect: (url: URL) =>
      ({
        status: 307,
        headers: new Map([['location', url.toString()]]),
      }) as never,
    next: () =>
      ({
        status: 200,
        headers: new Map(),
      }) as never,
  })
  return { NextResponse }
})

function makeReq(pathname: string, auth: unknown, search = '') {
  return {
    auth,
    nextUrl: {
      pathname,
      search,
      origin: 'http://localhost:3000',
      toString: () => `http://localhost:3000${pathname}${search}`,
    },
  } as never
}

describe('proxy middleware', () => {
  describe('public auth paths', () => {
    it('should redirect logged-in user from /login to /home', () => {
      const res = proxy(makeReq('/login', { accessToken: 'tok' })) as unknown as { status: number; headers: Map<string, string> }
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/home')
    })

    it('should allow anonymous user to access /login', () => {
      const res = proxy(makeReq('/login', null)) as unknown as { status: number }
      expect(res.status).toBe(200)
    })

    it('should allow anonymous user to access /forgot-password', () => {
      const res = proxy(makeReq('/forgot-password', null)) as unknown as { status: number }
      expect(res.status).toBe(200)
    })

    it('should allow anonymous user to access /reset-password', () => {
      const res = proxy(makeReq('/reset-password', null)) as unknown as { status: number }
      expect(res.status).toBe(200)
    })

    it('should redirect logged-in user from /forgot-password to /home', () => {
      const res = proxy(makeReq('/forgot-password', { accessToken: 'tok' })) as unknown as { status: number; headers: Map<string, string> }
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/home')
    })
  })

  describe('protected paths', () => {
    it('should redirect anonymous user from /home to /login with callbackUrl', () => {
      const res = proxy(makeReq('/home', null)) as unknown as { status: number; headers: Map<string, string> }
      expect(res.status).toBe(307)
      const location = res.headers.get('location') ?? ''
      expect(location).toContain('/login')
      expect(location).toContain('callbackUrl=%2Fhome')
    })

    it('should allow logged-in user to access /home', () => {
      const res = proxy(makeReq('/home', { accessToken: 'tok' })) as unknown as { status: number }
      expect(res.status).toBe(200)
    })

    it('should preserve search params in callbackUrl', () => {
      const res = proxy(makeReq('/reminders', null, '?page=2')) as unknown as { status: number; headers: Map<string, string> }
      const location = res.headers.get('location') ?? ''
      expect(location).toContain('callbackUrl=%2Freminders%3Fpage%3D2')
    })
  })
})
