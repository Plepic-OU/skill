import {
  initAnalytics,
  isAnalyticsEnabled,
  normalizePath,
  trackCtaClick,
  trackPageView,
  trackShare,
} from './analytics'

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
    expect(normalizePath('/profile/demo-alice')).toBe('/profile/:userId')
  })

  it('collapses shared-result paths to one route', () => {
    expect(normalizePath('/shared/3-2-4-normal')).toBe('/shared/:levels')
  })

  it('passes the landing path through', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('passes unknown paths through', () => {
    expect(normalizePath('/design-system')).toBe('/design-system')
  })

  it('replaces the username in profile paths with a trailing slash', () => {
    expect(normalizePath('/profile/demo-alice/')).toBe('/profile/:userId')
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
    expect(window.dataLayer?.map((entry) => Array.from(entry as ArrayLike<unknown>))).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-65CCEV6RS9', { send_page_view: false }],
    ])
  })

  // gtag.js runs only `arguments` objects from the dataLayer. Arrays are kept
  // but never sent: that is why the property had no hit from this host.
  it('pushes arguments objects, which gtag.js executes, not arrays', () => {
    vi.stubGlobal('location', { hostname: 'skill.plepic.com', origin: 'https://skill.plepic.com' })

    initAnalytics()

    for (const entry of window.dataLayer ?? []) {
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]')
    }
  })

  it('reports profile page views without the username', () => {
    vi.stubGlobal('location', { hostname: 'skill.plepic.com', origin: 'https://skill.plepic.com' })
    initAnalytics()

    trackPageView('/profile/demo-alice')

    expect(Array.from(window.dataLayer?.at(-1) as ArrayLike<unknown>)).toEqual([
      'event',
      'page_view',
      {
        page_path: '/profile/:userId',
        page_location: 'https://skill.plepic.com/profile/:userId',
      },
    ])
  })

  it('reports conversation-route clicks with their placement and a username-free location', () => {
    vi.stubGlobal('location', {
      hostname: 'skill.plepic.com',
      origin: 'https://skill.plepic.com',
      pathname: '/profile/demo-alice',
    })
    initAnalytics()

    trackCtaClick('book_call', 'landing')

    expect(Array.from(window.dataLayer?.at(-1) as ArrayLike<unknown>)).toEqual([
      'event',
      'cta_click',
      {
        cta_route: 'book_call',
        cta_placement: 'landing',
        page_location: 'https://skill.plepic.com/profile/:userId',
      },
    ])
  })

  it('reports shares by method with a username-free location', () => {
    vi.stubGlobal('location', {
      hostname: 'skill.plepic.com',
      origin: 'https://skill.plepic.com',
      pathname: '/profile/demo-alice/',
    })
    initAnalytics()

    trackShare('result_link')

    expect(Array.from(window.dataLayer?.at(-1) as ArrayLike<unknown>)).toEqual([
      'event',
      'share',
      {
        method: 'result_link',
        content_type: 'skill_tree',
        page_location: 'https://skill.plepic.com/profile/:userId',
      },
    ])
  })

  it('normalises a profile URL in the referrer', () => {
    vi.stubGlobal('location', {
      hostname: 'skill.plepic.com',
      origin: 'https://skill.plepic.com',
      pathname: '/',
    })
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(
      'https://skill.plepic.com/profile/demo-alice?x=1',
    )
    initAnalytics()

    trackPageView('/')

    expect(Array.from(window.dataLayer?.at(-1) as ArrayLike<unknown>)).toEqual([
      'event',
      'page_view',
      {
        page_path: '/',
        page_location: 'https://skill.plepic.com/',
        page_referrer: 'https://skill.plepic.com/profile/:userId',
      },
    ])
    vi.restoreAllMocks()
  })

  it('stays silent off the production host', () => {
    vi.stubGlobal('location', { hostname: 'localhost', origin: 'http://localhost' })
    initAnalytics()
    const before = window.dataLayer?.length ?? 0

    trackCtaClick('email', 'owner')
    trackShare('profile_link')

    expect(window.dataLayer?.length ?? 0).toBe(before)
  })
})
