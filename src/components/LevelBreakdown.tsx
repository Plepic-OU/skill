import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './LevelBreakdown.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]

interface LevelBreakdownProps {
  state: SkillState
}

export default function LevelBreakdown({ state }: LevelBreakdownProps) {
  return (
    <div className={styles.breakdown} aria-live="polite">
      <span className={styles.breakdownLabel}>By path</span>
      <div className={styles.breakdownRow}>
        {AXIS_IDS.map((id) => {
          const axis = skillTreeData.axes[id]
          return (
            <span key={id} className={styles.breakdownItem} data-axis={id}>
              <span className={styles.breakdownDot} style={{ background: axis.color }} />
              <span className={styles.breakdownName}>{axis.name}</span>
              <span className={styles.breakdownLevel}>
                {state[id]} / {axis.levels.length}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
