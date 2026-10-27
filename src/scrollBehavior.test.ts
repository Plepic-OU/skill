import { scrollBehavior } from './scrollBehavior'

describe('scrollBehavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('smooth-scrolls by default', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(scrollBehavior()).toBe('smooth')
  })

  it('jumps instantly when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }))
    expect(scrollBehavior()).toBe('auto')
  })
})
