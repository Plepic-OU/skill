import styles from './TrainingCTA.module.css'

const TRAINING_URL =
  'https://plepic.com/training' +
  '?utm_source=skilltree&utm_medium=app&utm_campaign=skilltree_completion&utm_content=owner_crest'

// Post-assessment conversion nudge, owner mode only: the moment someone has
// mapped their own level is the moment training becomes relevant. This is the
// single actionable ember accent in the owner viewport (One Accent Rule).
export default function TrainingCTA() {
  return (
    <aside className={styles.cta} aria-label="Training offer">
      <p className={styles.lead}>You've mapped where you stand. Want to close the gaps?</p>
      <p className={styles.sub}>
        Plepic's 6-week program trains the exact skills in this tree, on your own codebase.
      </p>
      <a className={styles.btn} href={TRAINING_URL} target="_blank" rel="noopener noreferrer">
        See the training <span aria-hidden="true">→</span>
      </a>
    </aside>
  )
}
