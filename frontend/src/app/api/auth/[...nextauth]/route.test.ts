import { GET, POST } from '@/app/api/auth/[...nextauth]/route'

jest.mock('@/lib/auth', () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}))

describe('api/auth/[...nextauth]/route', () => {
  it('should re-export GET handler', () => {
    expect(typeof GET).toBe('function')
  })

  it('should re-export POST handler', () => {
    expect(typeof POST).toBe('function')
  })
})
