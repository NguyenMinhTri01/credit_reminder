import { redirect } from 'next/navigation'

jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

describe('legacy /home route', () => {
  it('redirects to the canonical dashboard route', async () => {
    const HomePage = (await import('./page')).default

    HomePage()

    expect(redirect).toHaveBeenCalledWith('/')
  })
})
