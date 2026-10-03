import { computeProgression } from '../data/progression'
import { BOOKING_URL, leadMailto, trainingUrl } from '../data/links'
import { shareUrl } from '../data/share'
import { trackCtaClick, type CtaPlacement } from '../analytics'
import type { SkillState } from '../types/skill-tree'
import styles from './TrainingCTA.module.css'

// The bridge from a result to a conversation. It sits after the crest in every
// mode because the reader who matters most, a developer who is not a customer
// yet, never signs in: they map themselves on the landing page and leave.
//
// Three routes, in order of commitment: book a call (the single ember accent
// in the viewport), email the result with a subject the app sets (that subject
// is how a lead is counted), and read about the training on plepic.com.
interface TrainingCTAProps {
  variant: CtaPlacement
  state: SkillState
}

const COPY = {
  landing: {
    lead: 'You know where you stand. The fastest way up is with peers.',
    sub: "Plepic's cohort trains the exact skills in this tree, on your own codebase.",
    email: 'Email your result',
  },
  owner: {
    lead: 'You know where you stand. The fastest way up is with peers.',
    sub: "Plepic's cohort trains the exact skills in this tree, on your own codebase.",
    email: 'Email your result',
  },
  visitor: {
    lead: 'This is the map. Plepic teaches the territory.',
    sub: "Plepic's cohort trains the exact skills in this tree, on your team's own codebase.",
    email: 'Email this result',
  },
  shared: {
    lead: 'For team leads: Plepic trains whole teams on these skills.',
    sub: 'A private cohort, on your own codebase, so the whole team levels up together.',
    email: 'Email this result',
  },
} as const

const TRAINING_SOURCE = {
  landing: 'landing_crest',
  owner: 'owner_crest',
  visitor: 'visitor_crest',
  shared: 'shared_crest',
} as const

export default function TrainingCTA({ variant, state }: TrainingCTAProps) {
  const copy = COPY[variant]
  const { title, unifiedLevel } = computeProgression(state)
  // Someone else's result is emailed by its own URL; your own goes as an
  // anonymous levels-only link, so the mail carries no name either way.
  const resultUrl =
    variant === 'visitor' || variant === 'shared'
      ? window.location.href
      : shareUrl(window.location.origin, state)

  return (
    <aside className={styles.cta} aria-label="How to level up from here">
      <h2 className={styles.heading}>How to level up from here</h2>
      <p className={styles.lead}>{copy.lead}</p>
      <p className={styles.sub}>{copy.sub}</p>
      <div className={styles.actions}>
        <a
          className={styles.btn}
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCtaClick('book_call', variant)}
        >
          Book a call with Kaido
        </a>
        <a
          className={styles.btnOutline}
          href={leadMailto(title, unifiedLevel, resultUrl)}
          onClick={() => trackCtaClick('email', variant)}
        >
          {copy.email}
        </a>
      </div>
      <a
        className={styles.textLink}
        href={trainingUrl(TRAINING_SOURCE[variant])}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCtaClick('training_page', variant)}
      >
        See the training <span aria-hidden="true">→</span>
      </a>
    </aside>
  )
}
