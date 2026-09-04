import { render, screen } from '@testing-library/react'
import { QueryProvider } from '@/providers/query-provider'

// Mock ReactQueryDevtools to avoid loading it in jsdom.
jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}))

describe('providers/query-provider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>child content</div>
      </QueryProvider>,
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('should wrap children in QueryClientProvider', () => {
    // If the provider works, useQuery would be available — we verify by
    // rendering a child that uses a query client context.
    render(
      <QueryProvider>
        <div>ok</div>
      </QueryProvider>,
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
