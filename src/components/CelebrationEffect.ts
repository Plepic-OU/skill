/* eslint-disable sonarjs/pseudo-random -- confetti animation, not security-sensitive */

// Track the current celebration batch so concurrent calls clean up the previous one
let activeBatch: { container: HTMLElement; ripple: HTMLElement; flash: HTMLElement } | null = null
let activeTimer: ReturnType<typeof setTimeout> | null = null

/** Remove any active celebration elements from the DOM and cancel pending cleanup timer. */
export function cleanupCelebration(): void {
  if (activeTimer !== null) {
    clearTimeout(activeTimer)
    activeTimer = null
  }
  if (activeBatch) {
    activeBatch.container.remove()
    activeBatch.ripple.remove()
    activeBatch.flash.remove()
    activeBatch = null
  }
}

export function celebrate(element: HTMLElement, color: string): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Remove any previous celebration before starting a new one
  cleanupCelebration()

  const rect = element.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  // Particle burst — 16 particles radiating outward
  const container = document.createElement('div')
  container.className = 'claim-celebration'
  container.style.left = cx + 'px'
  container.style.top = cy + 'px'

  const types = ['spark', 'spark', 'dot', 'dot', 'ring']
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div')
    const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.4
    const dist = 40 + Math.random() * 60
    p.className = `claim-particle ${types[i % types.length]}`
    p.style.background = color
    p.style.borderColor = color
    p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`)
    p.style.animationDelay = `${Math.random() * 0.1}s`
    p.style.animationDuration = `${0.5 + Math.random() * 0.3}s`
    container.appendChild(p)
  }
  document.body.appendChild(container)

  // Ripple ring
  const ripple = document.createElement('div')
  ripple.className = 'claim-ripple'
  ripple.style.borderColor = color
  ripple.style.left = cx + 'px'
  ripple.style.top = cy + 'px'
  document.body.appendChild(ripple)

  // Center flash/glow
  const flash = document.createElement('div')
  flash.className = 'claim-flash'
  flash.style.background = `radial-gradient(circle, ${color}88 0%, transparent 70%)`
  flash.style.left = cx + 'px'
  flash.style.top = cy + 'px'
  document.body.appendChild(flash)

  // Store references for concurrent-call cleanup and external cleanup
  activeBatch = { container, ripple, flash }

  // Cleanup after animations
  activeTimer = setTimeout(() => {
    // Only clean up if this batch is still the active one
    if (activeBatch?.container === container) {
      activeBatch = null
      activeTimer = null
    }
    container.remove()
    ripple.remove()
    flash.remove()
  }, 900)
}
