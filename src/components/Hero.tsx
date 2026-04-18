import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './Hero.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]

interface HeroProps {
  state: SkillState
  visitorName?: string
  variant?: 'landing' | 'profile'
}

export default function Hero({ state, visitorName, variant = 'landing' }: HeroProps) {
  const isProfile = variant === 'profile' || Boolean(visitorName)
  const heroClass = `${styles.hero} ${isProfile ? styles.heroProfile : ''}`

  return (
    <section className={heroClass}>
      <h1 className={styles.title}>
        {visitorName ? `${visitorName}\u2019s Agentic Skills` : 'Map Your Agentic Skills'}
      </h1>
      {!isProfile && (
        <p className={styles.subtitle}>
          Where are you on the path to agentic development mastery? Claim the levels you've reached
          and see what's next.
        </p>
      )}
      <div className={styles.progressSummary} aria-live="polite">
        {AXIS_IDS.map((id) => {
          const axis = skillTreeData.axes[id]
          return (
            <span key={id} className={styles.progressChip}>
              <span className={styles.chipDot} style={{ background: axis.color }} />
              {axis.name} ·{' '}
              <span className={styles.chipLevel}>
                Lv {state[id]} of {axis.levels.length}
              </span>
            </span>
          )
        })}
      </div>
    </section>
  )
}
