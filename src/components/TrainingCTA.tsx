import { trainingUrl } from '../data/links'
import styles from './TrainingCTA.module.css'

// Post-assessment conversion nudge. It runs in two modes because the two
// readers arrive with different questions.
//
// An owner has just mapped their own level, so the offer is about their gaps.
// A visitor followed someone else's shared profile: they have no assessment of
// their own, and until now the app gave them no route to the training at all,
// which is the one path a prospect sent a colleague's profile actually walks.
//
// This is the single actionable ember accent in either viewport: the owner
// header carries no accent below the crest, and the visitor header's controls
// are outline and text only.
interface TrainingCTAProps {
  variant?: 'owner' | 'visitor'
}

const COPY = {
  owner: {
    lead: "You've mapped where you stand. Want to close the gaps?",
    sub: "Plepic's 6-week program trains the exact skills in this tree, on your own codebase.",
  },
  visitor: {
    lead: 'This is the map. Plepic teaches the territory.',
    sub: "Our 6-week program trains the exact skills in this tree, on your team's own codebase.",
  },
} as const

export default function TrainingCTA({ variant = 'owner' }: TrainingCTAProps) {
  const copy = COPY[variant]
  return (
    <aside className={styles.cta} aria-label="Training offer">
      <p className={styles.lead}>{copy.lead}</p>
      <p className={styles.sub}>{copy.sub}</p>
      <a
        className={styles.btn}
        href={trainingUrl(variant === 'owner' ? 'owner_crest' : 'visitor_crest')}
        target="_blank"
        rel="noopener noreferrer"
      >
        See the training <span aria-hidden="true">→</span>
      </a>
    </aside>
  )
}
