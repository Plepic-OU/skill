// Outbound links to plepic.com.
//
// Every exit from the skill tree carries its own utm_content so the funnel can
// tell the placements apart: a visitor who followed a shared profile is a very
// different signal from an owner who just finished their own assessment.

export const MAIN_SITE = 'https://plepic.com'

/** Where a training link came from. Becomes utm_content. */
export type TrainingLinkSource = 'owner_crest' | 'visitor_crest' | 'header_nav' | 'footer_nav'

export function trainingUrl(source: TrainingLinkSource): string {
  const url = new URL('/training', MAIN_SITE)
  url.searchParams.set('utm_source', 'skilltree')
  url.searchParams.set('utm_medium', 'app')
  url.searchParams.set(
    'utm_campaign',
    source === 'owner_crest' || source === 'visitor_crest'
      ? 'skilltree_completion'
      : 'skilltree_nav',
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
