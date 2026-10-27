import { useId, useRef } from 'react'
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
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const detailId = useId()
  useClaimAnimation(indicatorRef, color, nodeState === 'claimed', styles.justClaimed)

  // On the visitor view there's no "you" to be here, so the owner-voiced
  // "You are here" / "Starting point" labels read oddly. Use a neutral
  // "Current" marker instead. Owner view keeps the personal copy since the
  // level-1 default shouldn't overclaim as a milestone.
  let highestClaimedLabel: string
  if (readonly) {
    highestClaimedLabel = `Lv ${level.level} · Current`
  } else if (level.level === 1) {
    highestClaimedLabel = 'Starting point'
  } else {
    highestClaimedLabel = 'You are here'
  }
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

  // The header is the only toggle and the action button is its sibling, not
  // its child: a card that is itself a button swallowed the action button's
  // Enter/Space. One action button whose label changes keeps keyboard focus in
  // place when a claim turns "This is me" into "Step back one".
  const stepsBack = nodeState === 'claimed' && isHighestClaimed
  const showActionBtn = !readonly && (stepsBack || !isHighestClaimed)
  const actionLabel = stepsBack ? 'Step back one' : 'This is me'

  const handleAction = () => {
    if (stepsBack) {
      onUnclaim(axisId, level.level)
    } else {
      onClaim(axisId, level.level)
    }
  }

  const handleHeaderClick = (e: React.MouseEvent) => {
    // A collapsed card also opens from a click anywhere on it (below); stop
    // here so a header click does not toggle twice.
    e.stopPropagation()
    onToggle()
  }

  return (
    <div
      className={`${styles.node} ${styles[nodeState]} ${isExpanded ? styles.expanded : ''}`}
      data-skill-name={level.name}
      data-level={level.level}
      // Pointer convenience only; the header button is the keyboard route.
      onClick={isExpanded ? undefined : onToggle}
      // Not a tab stop, but a click anywhere still focuses the card as before,
      // so QuestPath's :focus-within "active path" skin outlasts the hover.
      tabIndex={-1}
    >
      <button
        type="button"
        className={styles.nodeTop}
        aria-expanded={isExpanded}
        aria-controls={detailId}
        aria-label={`Level ${level.level}: ${level.name} — ${ariaState}`}
        onClick={handleHeaderClick}
      >
        <span className={styles.indicator} data-indicator ref={indicatorRef}>
          <span className="material-symbols-rounded" aria-hidden="true">
            {level.levelIcon}
          </span>
        </span>
        <span className={styles.nodeText}>
          <span className={styles.levelLabel}>{levelLabel}</span>
          <span className={styles.nodeName}>{level.name}</span>
        </span>
        <span className={styles.expandArrow} aria-hidden="true">
          &#x25BC;
        </span>
      </button>

      {(nodeState === 'claimed' || nodeState === 'frontier') && !isExpanded && (
        <div className={styles.descPreview}>{level.desc}</div>
      )}

      <div id={detailId} className={styles.detail} data-detail inert={!isExpanded}>
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
            <div className={styles.sectionTitle}>How to level up from here</div>
            <ul className={styles.detailList}>
              {level.howToProgress.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </>
        )}

        {showActionBtn && (
          <button
            type="button"
            className={`${styles.actionBtn} ${stepsBack ? styles.unclaimBtn : styles.claimBtn}`}
            aria-label={`${actionLabel}: ${level.name}`}
            onClick={handleAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
