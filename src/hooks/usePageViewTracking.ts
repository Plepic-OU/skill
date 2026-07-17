import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { trackPageView } from '../analytics'

/** Reports a GA4 page view on mount and on every route change. */
export function usePageViewTracking() {
  const { pathname } = useLocation()

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])
}
