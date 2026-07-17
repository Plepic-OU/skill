// Google Analytics 4. Shares the plepic.com property — skill.plepic.com is a
// subdomain of the same root domain, so no cross-domain config is needed.
// The measurement ID is public (it ships in the client bundle), not a secret.
const MEASUREMENT_ID = 'G-65CCEV6RS9'
const PRODUCTION_HOSTNAME = 'skill.plepic.com'
const DO_NOT_TRACK_ENABLED = '1'
const PROFILE_ROUTE = /^\/profile\/[^/]+$/

type GtagArgs =
  | ['js', Date]
  | ['config', string, Record<string, unknown>]
  | ['event', string, Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
    // Legacy DNT surfaces lib.dom doesn't declare (Navigator.doNotTrack it does).
    doNotTrack?: string | null
  }
  interface Navigator {
    msDoNotTrack?: string | null
  }
}

/**
 * Analytics runs on the production host only, and never against a Do Not Track
 * signal (plepic.com's privacy policy promises we respect it). Excluding every
 * other hostname keeps local dev, per-PR preview envs, jsdom and E2E out of the
 * production property.
 */
export function isAnalyticsEnabled(hostname: string, doNotTrack: string | null): boolean {
  return hostname === PRODUCTION_HOSTNAME && doNotTrack !== DO_NOT_TRACK_ENABLED
}

/** Route paths are reported as-is, except profile URLs: usernames stay out of GA4. */
export function normalizePath(path: string): string {
  return PROFILE_ROUTE.test(path) ? '/profile/:userId' : path
}

function readDoNotTrack(): string | null {
  return navigator.doNotTrack ?? window.doNotTrack ?? navigator.msDoNotTrack ?? null
}

let enabled = false

export function initAnalytics(): void {
  enabled = isAnalyticsEnabled(window.location.hostname, readDoNotTrack())
  if (!enabled) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  const dataLayer = (window.dataLayer ??= [])
  window.gtag = (...args: GtagArgs) => {
    dataLayer.push(args)
  }
  window.gtag('js', new Date())
  // send_page_view: false — the router owns page views (see usePageViewTracking),
  // so the first load isn't counted twice.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

export function trackPageView(path: string): void {
  if (!enabled) return
  const normalized = normalizePath(path)
  window.gtag?.('event', 'page_view', {
    page_path: normalized,
    // Set explicitly: GA4 otherwise reads the raw URL off window.location.
    page_location: `${window.location.origin}${normalized}`,
  })
}
