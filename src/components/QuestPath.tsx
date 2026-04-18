import { useRef, useState } from 'react'
import type { Axis, AxisId, Level, NodeState } from '../types/skill-tree'
import SkillNode from './SkillNode'
import styles from './QuestPath.module.css'

// Height of the sticky header (56px) plus a small breathing gap.
const HEADER_OFFSET = 70

interface QuestPathProps {
  axis: Axis
  axisId: AxisId
  claimedLevel: number
  onClaim: (axisId: AxisId, level: number) => void
  onUnclaim: (axisId: AxisId, level: number) => void
  readonly?: boolean
  /** When true, this path can be collapsed. Renders the ribbon as a button
   *  and transitions nodeList to zero height when `collapsed`. */
  canCollapse?: boolean
  /** Only meaningful when canCollapse is true. */
  collapsed?: boolean
  onToggleCollapsed?: (axisId: AxisId) => void
}

interface QuestPathNodeProps {
  level: Level
  index: number
  axisId: AxisId
  color: string
  nodeState: NodeState
  isHighestClaimed: boolean
  isExpanded: boolean
  connectorType?: 'solid' | 'dashed' | 'faded'
  onToggle: () => void
  onClaim: (axisId: AxisId, level: number) => void
  onUnclaim: (axisId: AxisId, level: number) => void
  readonly?: boolean
}

function QuestPathNode({
  level,
  index,
  axisId,
  color,
  nodeState,
  isHighestClaimed,
  isExpanded,
  connectorType,
  onToggle,
  onClaim,
  onUnclaim,
  readonly,
}: QuestPathNodeProps) {
  return (
    <div className={styles.nodeWrapper}>
      {index > 0 && connectorType && (
        <div className={`${styles.trailConnector} ${styles[connectorType]}`}>
          <div className={styles.vineLine} />
        </div>
      )}
      <SkillNode
        level={level}
        axisId={axisId}
        color={color}
        nodeState={nodeState}
        isHighestClaimed={isHighestClaimed}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onClaim={onClaim}
        onUnclaim={onUnclaim}
        readonly={readonly}
      />
    </div>
  )
}

export default function QuestPath({
  axis,
  axisId,
  claimedLevel,
  onClaim,
  onUnclaim,
  readonly,
  canCollapse = false,
  collapsed = false,
  onToggleCollapsed,
}: QuestPathProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // When opening a node while another is already open, the closing sibling's
  // detail shrinks over ~500ms. A naive scrollIntoView chases a moving target
  // and overshoots. Predict the final offsetTop by subtracting the collapsing
  // sibling's current detail height (if it sits above), then smooth-scroll to
  // that fixed target. Scroll and CSS transitions animate to the same endpoint.
  const scrollToNodeAtFinalPosition = (opening: number, closing: number | null) => {
    const container = containerRef.current
    if (!container) return
    const newNode = container.querySelector<HTMLElement>(`[data-level="${opening}"]`)
    if (!newNode) return
    const newTop = newNode.getBoundingClientRect().top + window.scrollY

    let adjustment = 0
    if (closing !== null) {
      const closingDetail = container.querySelector<HTMLElement>(
        `[data-level="${closing}"] [data-detail]`,
      )
      if (closingDetail) {
        const closingTop = closingDetail.getBoundingClientRect().top + window.scrollY
        // Only nodes above the new one push it when they collapse.
        if (closingTop < newTop) adjustment = closingDetail.offsetHeight
      }
    }

    const targetY = Math.max(0, newTop - adjustment - HEADER_OFFSET)
    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  const toggleNode = (level: number) => {
    const closing = expandedLevel
    const isOpening = closing !== level
    if (isOpening) scrollToNodeAtFinalPosition(level, closing)
    setExpandedLevel(isOpening ? level : null)
  }

  const getConnectorType = (index: number): 'solid' | 'dashed' | 'faded' => {
    const currentLevel = axis.levels[index].level
    const prevLevel = axis.levels[index - 1].level
    const prevClaimed = prevLevel <= claimedLevel
    const currentClaimed = currentLevel <= claimedLevel
    const isFrontier = currentLevel === claimedLevel + 1

    if (currentClaimed && prevClaimed) return 'solid'
    if (isFrontier && !readonly) return 'dashed'
    return 'faded'
  }

  const levelMax = axis.levels.length
  const isExpandedForCollapseUX = canCollapse && !collapsed
  const pathClasses = [
    styles.questPath,
    canCollapse ? styles.collapsible : '',
    collapsed ? styles.collapsed : '',
  ]
    .filter(Boolean)
    .join(' ')

  const HeaderTag = canCollapse ? 'button' : 'div'
  const headerProps = canCollapse
    ? {
        type: 'button' as const,
        className: styles.pathHeader,
        onClick: () => onToggleCollapsed?.(axisId),
        'aria-expanded': !collapsed,
        'aria-controls': `path-body-${axisId}`,
      }
    : { className: styles.pathHeader }

  return (
    <div
      ref={containerRef}
      className={pathClasses}
      data-quest-path={axisId}
      style={{ '--node-color': axis.color } as React.CSSProperties}
    >
      <HeaderTag {...headerProps}>
        <div className={styles.pathIcon} style={{ color: axis.color }}>
          <span className="material-symbols-rounded">{axis.icon}</span>
        </div>
        <div className={styles.ribbonBanner}>
          <span className={styles.ribbonName}>{axis.name}</span>
          <span className={styles.ribbonMeta}>
            Lv {claimedLevel}/{levelMax}
          </span>
          {canCollapse && (
            <span className={`material-symbols-rounded ${styles.ribbonChevron}`} aria-hidden="true">
              {isExpandedForCollapseUX ? 'expand_less' : 'expand_more'}
            </span>
          )}
          <span className={styles.ribbonFoldLeft} />
          <span className={styles.ribbonFoldRight} />
        </div>
        <div className={styles.pathSubtitle}>{axis.description}</div>
      </HeaderTag>

      <div id={`path-body-${axisId}`} className={styles.pathBody} aria-hidden={collapsed}>
        <div className={styles.nodeList}>
          {axis.levels.map((level, i) => {
            const isClaimed = level.level <= claimedLevel
            const isFrontier = level.level === claimedLevel + 1
            let nodeState: NodeState = 'future'
            if (isClaimed) nodeState = 'claimed'
            else if (isFrontier && !readonly) nodeState = 'frontier'

            return (
              <QuestPathNode
                key={level.level}
                level={level}
                index={i}
                axisId={axisId}
                color={axis.color}
                nodeState={nodeState}
                isHighestClaimed={isClaimed && level.level === claimedLevel}
                isExpanded={expandedLevel === level.level}
                connectorType={i > 0 ? getConnectorType(i) : undefined}
                onToggle={() => toggleNode(level.level)}
                onClaim={onClaim}
                onUnclaim={onUnclaim}
                readonly={readonly}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
