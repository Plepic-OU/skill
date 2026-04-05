import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import QuestPath from './QuestPath'
import styles from './SkillTree.module.css'

const AXIS_IDS: AxisId[] = ['autonomy', 'parallelExecution', 'skillUsage']

interface SkillTreeProps {
  state: SkillState
  onClaim: (axisId: AxisId, level: number) => void
  onUnclaim: (axisId: AxisId, level: number) => void
}

export default function SkillTree({ state, onClaim, onUnclaim }: SkillTreeProps) {
  return (
    <main>
      <div id="questMap" className={styles.questMap} role="region" aria-label="Skill tree paths">
        {AXIS_IDS.map((id) => (
          <QuestPath
            key={id}
            axis={skillTreeData.axes[id]}
            axisId={id}
            claimedLevel={state[id]}
            onClaim={onClaim}
            onUnclaim={onUnclaim}
          />
        ))}
      </div>
    </main>
  )
}
