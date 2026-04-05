import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './Hero.module.css'

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']

interface HeroProps {
  state: SkillState
}

export default function Hero({ state }: HeroProps) {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Map Your Agentic Skills</h1>
      <p className={styles.subtitle}>
        Where are you on the path to agentic development mastery? Claim the levels you've reached
        and see what's next.
      </p>
      <div className={styles.progressSummary} aria-live="polite">
        {AXIS_IDS.map((id) => {
          const axis = skillTreeData.axes[id]
          return (
            <span key={id} className={styles.progressChip}>
              <span className={styles.chipDot} style={{ background: axis.color }} />
              {axis.name}:{' '}
              <span className={styles.chipLevel}>
                {state[id]}/{axis.levels.length}
              </span>
            </span>
          )
        })}
      </div>
    </section>
  )
}
