import { render, screen, act, cleanup } from '@testing-library/react'
import Toast, { showToast } from '../Toast'

// Note: Toast auto-dismiss (via CSS fadeOut + onAnimationEnd) can't be unit-tested
// because React 19's onAnimationEnd doesn't fire in jsdom. Covered by E2E instead.

describe('Toast', () => {
  beforeEach(() => {
    render(<Toast />)
  })

  it('renders nothing when there are no messages', () => {
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows a toast message after showToast is called', () => {
    act(() => showToast('Copied!'))

    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('defaults to success type', () => {
    act(() => showToast('Done'))

    const toast = screen.getByText('Done')
    expect(toast).toHaveAttribute('data-type', 'success')
  })

  it('applies error type when specified', () => {
    act(() => showToast('Failed', 'error'))

    const toast = screen.getByText('Failed')
    expect(toast).toHaveAttribute('data-type', 'error')
  })

  it('renders multiple toasts', () => {
    act(() => {
      showToast('First')
      showToast('Second')
    })

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('has aria-live polite for accessibility', () => {
    act(() => showToast('Accessible'))

    const container = screen.getByText('Accessible').parentElement
    expect(container).toHaveAttribute('aria-live', 'polite')
  })

  it('allows a second Toast instance to mount (last mount wins)', () => {
    // First instance is already mounted via beforeEach.
    // Mounting a second should NOT throw — last mount wins for StrictMode safety.
    expect(() => {
      render(<Toast />)
    }).not.toThrow()

    // showToast should still work, routed to the last mounted instance
    act(() => showToast('works'))
    expect(screen.getByText('works')).toBeInTheDocument()
  })
})

describe('Toast unmount behavior', () => {
  it('resets addToastFn on unmount so showToast becomes a no-op', () => {
    render(<Toast />)

    // Unmount the Toast
    cleanup()

    // showToast should silently no-op (not throw) when nothing is mounted
    expect(() => {
      act(() => showToast('Ghost'))
    }).not.toThrow()

    // Nothing rendered — query should find nothing
    expect(screen.queryByText('Ghost')).toBeNull()
  })
})
