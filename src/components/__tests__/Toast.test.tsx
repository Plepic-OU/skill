import { render, screen, act } from '@testing-library/react'
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
    expect(toast.className).toMatch(/success/)
  })

  it('applies error type when specified', () => {
    act(() => showToast('Failed', 'error'))

    const toast = screen.getByText('Failed')
    expect(toast.className).toMatch(/error/)
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
})
