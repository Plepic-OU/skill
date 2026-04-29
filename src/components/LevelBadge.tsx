import { computeProgression } from '../data/progression'
import type { SkillState } from '../types/skill-tree'
import styles from './LevelBadge.module.css'

interface LevelBadgeProps {
  state: SkillState
}

function scrollToCrest() {
  const crest = document.getElementById('level-crest')
  if (!crest) return
  crest.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LevelBadge({ state }: LevelBadgeProps) {
  const { unifiedLevel, classInfo, stakesPrefix, title } = computeProgression(state)
  return (
    <button
      type="button"
      className={styles.levelBadge}
      aria-label={`Level ${unifiedLevel}, ${title}. Jump to class details.`}
      onClick={scrollToCrest}
    >
      <span className={styles.levelSeal}>
        <span className={styles.levelSealLabel}>Lv</span>
        <span className={styles.levelSealNumber}>{unifiedLevel}</span>
      </span>
      <span className={styles.levelClass}>
        {stakesPrefix && (
          <em className={styles.levelPrefix} aria-hidden="true">
            {stakesPrefix}
          </em>
        )}
        <span className={styles.levelClassName}>{classInfo.name}</span>
      </span>
    </button>
  )
}
