import { useState } from 'react'
import type { Axis, AxisId, Level, NodeState } from '../types/skill-tree'
import SkillNode from './SkillNode'
import styles from './QuestPath.module.css'

interface QuestPathProps {
  axis: Axis
  axisId: AxisId
  claimedLevel: number
  onClaim: (axisId: AxisId, level: number) => void
  onUnclaim: (axisId: AxisId, level: number) => void
  readonly?: boolean
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
}: QuestPathProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)

  const toggleNode = (level: number) => {
    setExpandedLevel((prev) => (prev === level ? null : level))
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

  return (
    <div className={styles.questPath} style={{ '--node-color': axis.color } as React.CSSProperties}>
      <div className={styles.pathHeader}>
        <div className={styles.pathIcon} style={{ color: axis.color }}>
          <span className="material-symbols-rounded">{axis.icon}</span>
        </div>
        <div className={styles.ribbonBanner}>
          {axis.name}
          <span className={styles.ribbonFoldLeft} />
          <span className={styles.ribbonFoldRight} />
        </div>
        <div className={styles.pathSubtitle}>{axis.description}</div>
      </div>

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
  )
}
