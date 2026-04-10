import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { celebrate, cleanupCelebration } from '../CelebrationEffect'

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches } as MediaQueryList)
}

describe('celebrate', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    element.getBoundingClientRect = () =>
      ({ left: 100, top: 200, width: 50, height: 50 }) as DOMRect
    stubMatchMedia(false)
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanupCelebration()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('creates particles, ripple, and flash elements', () => {
    celebrate(element, '#00ff00')

    expect(document.querySelector('.claim-celebration')).not.toBeNull()
    expect(document.querySelectorAll('.claim-particle')).toHaveLength(16)
    expect(document.querySelector('.claim-ripple')).not.toBeNull()
    expect(document.querySelector('.claim-flash')).not.toBeNull()
  })

  it('positions elements at the center of the target', () => {
    celebrate(element, '#00ff00')

    const container = document.querySelector('.claim-celebration') as HTMLElement
    expect(container.style.left).toBe('125px') // 100 + 50/2
    expect(container.style.top).toBe('225px') // 200 + 50/2
  })

  it('applies the given color to particles', () => {
    celebrate(element, '#ff0000')

    const particle = document.querySelector('.claim-particle') as HTMLElement
    expect(particle.style.background).toBe('rgb(255, 0, 0)')
    expect(particle.style.borderColor).toBe('rgb(255, 0, 0)')
  })

  it('cleans up all elements after 900ms', () => {
    celebrate(element, '#00ff00')

    expect(document.querySelector('.claim-celebration')).not.toBeNull()

    vi.advanceTimersByTime(900)

    expect(document.querySelector('.claim-celebration')).toBeNull()
    expect(document.querySelector('.claim-ripple')).toBeNull()
    expect(document.querySelector('.claim-flash')).toBeNull()
  })

  it('skips animation when prefers-reduced-motion is set', () => {
    stubMatchMedia(true)

    celebrate(element, '#00ff00')

    expect(document.querySelector('.claim-celebration')).toBeNull()
  })

  it('sets custom properties for particle trajectory', () => {
    celebrate(element, '#00ff00')

    const particle = document.querySelector('.claim-particle') as HTMLElement
    expect(particle.style.getPropertyValue('--tx')).toMatch(/^-?\d+(\.\d+)?px$/)
    expect(particle.style.getPropertyValue('--ty')).toMatch(/^-?\d+(\.\d+)?px$/)
  })

  it('removes previous batch when celebrate is called concurrently', () => {
    celebrate(element, '#ff0000')
    expect(document.querySelectorAll('.claim-celebration')).toHaveLength(1)
    expect(document.querySelectorAll('.claim-ripple')).toHaveLength(1)
    expect(document.querySelectorAll('.claim-flash')).toHaveLength(1)

    // Second call before timeout fires — previous batch should be removed
    celebrate(element, '#00ff00')
    expect(document.querySelectorAll('.claim-celebration')).toHaveLength(1)
    expect(document.querySelectorAll('.claim-ripple')).toHaveLength(1)
    expect(document.querySelectorAll('.claim-flash')).toHaveLength(1)
  })

  it('cleanupCelebration removes active elements immediately', () => {
    celebrate(element, '#00ff00')
    expect(document.querySelector('.claim-celebration')).not.toBeNull()

    cleanupCelebration()

    expect(document.querySelector('.claim-celebration')).toBeNull()
    expect(document.querySelector('.claim-ripple')).toBeNull()
    expect(document.querySelector('.claim-flash')).toBeNull()
  })

  it('cleanupCelebration cancels the pending timeout', () => {
    celebrate(element, '#00ff00')
    cleanupCelebration()

    // Create new elements manually to verify the old timer does not fire
    const sentinel = document.createElement('div')
    sentinel.className = 'claim-celebration'
    document.body.appendChild(sentinel)

    vi.advanceTimersByTime(900)

    // Sentinel should still be present — the old timer was cancelled
    expect(document.querySelector('.claim-celebration')).not.toBeNull()
    sentinel.remove()
  })

  it('cleanupCelebration is safe to call when no celebration is active', () => {
    expect(() => cleanupCelebration()).not.toThrow()
  })
})
