import { skillTreeData } from '../data/skill-trees'
import { useActiveAxis } from '../hooks/useActiveAxis'
import type { AxisId, SkillState } from '../types/skill-tree'
import QuestPath from './QuestPath'
import styles from './SkillTree.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]

interface SkillTreeProps {
  state: SkillState
  onClaim?: (axisId: AxisId, level: number) => void
  onUnclaim?: (axisId: AxisId, level: number) => void
  readonly?: boolean
}

const noop = () => {}

export default function SkillTree({ state, onClaim, onUnclaim, readonly }: SkillTreeProps) {
  // data-active-axis on #questMap drives the active-card skin on mobile (see
  // QuestPath.module.css). Desktop ignores it — :hover/:focus-within still
  // own the active state there, since touch can't hover.
  const activeAxis = useActiveAxis()
  return (
    <main>
      <div
        id="questMap"
        className={styles.questMap}
        role="region"
        aria-label="Skill tree paths"
        data-active-axis={activeAxis}
      >
        {AXIS_IDS.map((id) => (
          <QuestPath
            key={id}
            axis={skillTreeData.axes[id]}
            axisId={id}
            claimedLevel={state[id]}
            onClaim={onClaim ?? noop}
            onUnclaim={onUnclaim ?? noop}
            readonly={readonly}
          />
        ))}
      </div>
    </main>
  )
}
