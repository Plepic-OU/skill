// Outbound links to plepic.com.
//
// Every exit from the skill tree carries its own utm_content so the funnel can
// tell the placements apart: a visitor who followed a shared profile is a very
// different signal from an owner who just finished their own assessment.

export const MAIN_SITE = 'https://plepic.com'

/** Where a training link came from. Becomes utm_content. */
export type TrainingLinkSource =
  | 'landing_crest'
  | 'owner_crest'
  | 'visitor_crest'
  | 'shared_crest'
  | 'header_nav'
  | 'footer_nav'

const NAV_SOURCES: TrainingLinkSource[] = ['header_nav', 'footer_nav']

export function trainingUrl(source: TrainingLinkSource): string {
  const url = new URL('/training', MAIN_SITE)
  url.searchParams.set('utm_source', 'skilltree')
  url.searchParams.set('utm_medium', 'app')
  url.searchParams.set(
    'utm_campaign',
    NAV_SOURCES.includes(source) ? 'skilltree_nav' : 'skilltree_completion',
  )
  url.searchParams.set('utm_content', source)
  return url.toString()
}

/** Main-site destinations offered in the footer, mirroring plepic.com's own footer. */
export const FOOTER_LINKS = [
  { label: 'Claude Code', href: `${MAIN_SITE}/claude-code/` },
  { label: 'Training', href: trainingUrl('footer_nav') },
  { label: 'Scopeful', href: `${MAIN_SITE}/scopeful/` },
  { label: 'Jobs', href: `${MAIN_SITE}/jobs/` },
] as const

/** Kaido's public booking page. The app never books; the visitor does. */
export const BOOKING_URL = 'https://calendar.app.google/h5sq5y19e8a11GRQ7'

export const LEAD_EMAIL = 'kaido@plepic.com'

// The subject prefix is the lead tag: a mail to Kaido whose subject starts
// with it was sent from the app. Gmail query: subject:"Skill Tree result".
export const LEAD_SUBJECT_PREFIX = 'Skill Tree result'

/** A mailto link whose subject names the skill tree and the result's class. */
export function leadMailto(title: string, unifiedLevel: number, resultUrl: string): string {
  const subject = `${LEAD_SUBJECT_PREFIX}: ${title}, Lv ${unifiedLevel}`
  const body = `Hi Kaido,\n\nSkill tree result: ${resultUrl}\n\n`
  return `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
