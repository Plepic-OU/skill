import { initAnalytics, isAnalyticsEnabled, normalizePath, trackPageView } from './analytics'

const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=G-65CCEV6RS9'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isAnalyticsEnabled', () => {
  it('enables analytics on the production host', () => {
    expect(isAnalyticsEnabled('skill.plepic.com', null)).toBe(true)
  })

  it('enables analytics when Do Not Track is off', () => {
    expect(isAnalyticsEnabled('skill.plepic.com', '0')).toBe(true)
  })

  it('disables analytics on localhost', () => {
    expect(isAnalyticsEnabled('localhost', null)).toBe(false)
  })

  it('disables analytics on preview environments', () => {
    expect(isAnalyticsEnabled('preview-pr-42-abcdef-ew.a.run.app', null)).toBe(false)
  })

  it('disables analytics on look-alike hosts', () => {
    expect(isAnalyticsEnabled('skill.plepic.com.evil.example', null)).toBe(false)
  })

  it('disables analytics when Do Not Track is enabled', () => {
    expect(isAnalyticsEnabled('skill.plepic.com', '1')).toBe(false)
  })
})

describe('normalizePath', () => {
  it('replaces the username in profile paths', () => {
    expect(normalizePath('/profile/demo-alice')).toBe('/profile/:username')
  })

  it('passes the landing path through', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('passes unknown paths through', () => {
    expect(normalizePath('/design-system')).toBe('/design-system')
  })

  it('passes a profile path without a username through', () => {
    expect(normalizePath('/profile/')).toBe('/profile/')
  })
})

describe('initAnalytics', () => {
  it('loads gtag and defers page views to the router on the production host', () => {
    vi.stubGlobal('location', { hostname: 'skill.plepic.com', origin: 'https://skill.plepic.com' })

    initAnalytics()

    const script = document.querySelector<HTMLScriptElement>(`script[src="${GTAG_SRC}"]`)
    expect(script?.async).toBe(true)
    expect(window.dataLayer).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-65CCEV6RS9', { send_page_view: false }],
    ])
  })

  it('reports profile page views without the username', () => {
    vi.stubGlobal('location', { hostname: 'skill.plepic.com', origin: 'https://skill.plepic.com' })
    initAnalytics()

    trackPageView('/profile/demo-alice')

    expect(window.dataLayer?.at(-1)).toEqual([
      'event',
      'page_view',
      {
        page_path: '/profile/:username',
        page_location: 'https://skill.plepic.com/profile/:username',
      },
    ])
  })
})
