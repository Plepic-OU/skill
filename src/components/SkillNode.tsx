import type { AxisId, Level } from '../types/skill-tree'
import styles from './SkillNode.module.css'

type NodeState = 'claimed' | 'frontier' | 'future'

interface SkillNodeProps {
  level: Level
  axisId: AxisId
  nodeState: NodeState
  isHighestClaimed: boolean
  isExpanded: boolean
  onToggle: () => void
  onClaim: (axisId: AxisId, level: number) => void
  onUnclaim: (axisId: AxisId, level: number) => void
  readonly?: boolean
}

export default function SkillNode({
  level,
  axisId,
  nodeState,
  isHighestClaimed,
  isExpanded,
  onToggle,
  onClaim,
  onUnclaim,
  readonly,
}: SkillNodeProps) {
  const levelLabels: Record<NodeState, string> = {
    claimed: isHighestClaimed ? 'You are here' : `Level ${level.level}`,
    frontier: 'Up next',
    future: `Level ${level.level}`,
  }
  const levelLabel = levelLabels[nodeState]

  const ariaStates: Record<NodeState, string> = {
    claimed: 'reached',
    frontier: 'up next',
    future: 'not yet reached',
  }
  const ariaState = ariaStates[nodeState]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (nodeState === 'claimed' && isHighestClaimed) {
      onUnclaim(axisId, level.level)
    } else {
      onClaim(axisId, level.level)
    }
  }

  const showClaimBtn = !readonly && nodeState !== 'claimed'
  const showUnclaimBtn = !readonly && nodeState === 'claimed' && isHighestClaimed

  return (
    <div
      className={`${styles.node} ${styles[nodeState]} ${isExpanded ? styles.expanded : ''}`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Level ${level.level}: ${level.name} — ${ariaState}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.nodeTop}>
        <div className={styles.indicator} data-indicator>
          <span className="material-symbols-rounded" aria-hidden="true">
            {level.levelIcon}
          </span>
        </div>
        <div className={styles.nodeText}>
          <div className={styles.levelLabel}>{levelLabel}</div>
          <div className={styles.nodeName}>{level.name}</div>
        </div>
        <span className={styles.expandArrow} aria-hidden="true">
          &#x25BC;
        </span>
      </div>

      {(nodeState === 'claimed' || nodeState === 'frontier') && !isExpanded && (
        <div className={styles.descPreview}>{level.desc}</div>
      )}

      <div className={styles.detail}>
        <div className={styles.descFull}>{level.desc}</div>

        {level.verification && (
          <>
            <div className={styles.sectionTitle}>How you verify</div>
            <p className={styles.verificationText}>{level.verification}</p>
          </>
        )}

        {level.obstacles.length > 0 && (
          <>
            <div className={styles.sectionTitle}>What makes this hard</div>
            <ul className={styles.detailList}>
              {level.obstacles.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </>
        )}

        {level.howToProgress.length > 0 && (
          <>
            <div className={styles.sectionTitle}>How to get here</div>
            <ul className={styles.detailList}>
              {level.howToProgress.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </>
        )}

        {showClaimBtn && (
          <button className={`${styles.actionBtn} ${styles.claimBtn}`} onClick={handleActionClick}>
            This is me
          </button>
        )}
        {showUnclaimBtn && (
          <button
            className={`${styles.actionBtn} ${styles.unclaimBtn}`}
            onClick={handleActionClick}
          >
            Not here yet
          </button>
        )}
      </div>
    </div>
  )
}
