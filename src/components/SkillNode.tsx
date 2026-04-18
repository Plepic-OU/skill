import { useRef } from 'react'
import { useClaimAnimation } from '../hooks/useClaimAnimation'
import type { AxisId, Level, NodeState } from '../types/skill-tree'
import styles from './SkillNode.module.css'

interface SkillNodeProps {
  level: Level
  axisId: AxisId
  color: string
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
  color,
  nodeState,
  isHighestClaimed,
  isExpanded,
  onToggle,
  onClaim,
  onUnclaim,
  readonly,
}: SkillNodeProps) {
  const indicatorRef = useRef<HTMLDivElement>(null)
  useClaimAnimation(indicatorRef, color, nodeState === 'claimed', styles.justClaimed)

  // For the default level-1 node on any axis, "You are here" overclaims:
  // the user hasn't actively marked their position yet. Call it a neutral
  // starting point until they progress past the default.
  const highestClaimedLabel = level.level === 1 ? 'Starting point' : 'You are here'
  const levelLabels: Record<NodeState, string> = {
    claimed: isHighestClaimed ? highestClaimedLabel : `Lv ${level.level} · Reached`,
    frontier: `Lv ${level.level}`,
    future: `Lv ${level.level}`,
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

  const showClaimBtn = !readonly && !isHighestClaimed
  const showUnclaimBtn = !readonly && nodeState === 'claimed' && isHighestClaimed

  return (
    <div
      className={`${styles.node} ${styles[nodeState]} ${isExpanded ? styles.expanded : ''}`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`Level ${level.level}: ${level.name} — ${ariaState}`}
      data-skill-name={level.name}
      data-level={level.level}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.nodeTop}>
        <div className={styles.indicator} data-indicator ref={indicatorRef}>
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

      <div className={styles.detail} data-detail>
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
            <div className={styles.sectionTitle}>How to reach this level</div>
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
            Step back one
          </button>
        )}
      </div>
    </div>
  )
}
