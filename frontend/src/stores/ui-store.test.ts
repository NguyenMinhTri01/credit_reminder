import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '@/stores/ui-store'

describe('stores/ui-store', () => {
  beforeEach(() => {
    // Reset store between tests.
    act(() => {
      useUIStore.setState({ isSidebarOpen: true, isLoading: false })
    })
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useUIStore())

    expect(result.current.isSidebarOpen).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useUIStore())

    act(() => result.current.toggleSidebar())
    expect(result.current.isSidebarOpen).toBe(false)

    act(() => result.current.toggleSidebar())
    expect(result.current.isSidebarOpen).toBe(true)
  })

  it('should set sidebar open explicitly', () => {
    const { result } = renderHook(() => useUIStore())

    act(() => result.current.setSidebarOpen(false))
    expect(result.current.isSidebarOpen).toBe(false)

    act(() => result.current.setSidebarOpen(true))
    expect(result.current.isSidebarOpen).toBe(true)
  })

  it('should set loading', () => {
    const { result } = renderHook(() => useUIStore())

    act(() => result.current.setLoading(true))
    expect(result.current.isLoading).toBe(true)
  })
})
