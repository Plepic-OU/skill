import { render, screen, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
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

  it('throws when a second Toast instance mounts (singleton guard)', () => {
    // First instance is already mounted via beforeEach.
    // Mounting a second should throw in dev mode.
    expect(() => {
      render(<Toast />)
    }).toThrow('singleton')
  })

  it('resets addToastFn on unmount so showToast becomes a no-op', () => {
    // Unmount the Toast rendered in beforeEach
    cleanup()

    // showToast should silently no-op (not throw) when nothing is mounted
    expect(() => {
      act(() => showToast('Ghost'))
    }).not.toThrow()

    // Nothing rendered — query should find nothing
    expect(screen.queryByText('Ghost')).toBeNull()

    // Re-mount for remaining test teardown consistency
    render(<Toast />)
  })
})
