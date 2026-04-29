import { computeProgression } from '../data/progression'
import { useLevelUpCelebration } from '../hooks/useLevelUpCelebration'
import type { SkillState } from '../types/skill-tree'
import LevelBreakdown from './LevelBreakdown'
import styles from './LevelCrest.module.css'

interface LevelCrestProps {
  state: SkillState
  visitor?: boolean
}

interface ProgressViewProps {
  isMaxLevel: boolean
  justReached: boolean
  unifiedLevel: number
  xpIntoLevel: number
  xpForNextLevel: number
  barPercent: number
}

function ProgressView({
  isMaxLevel,
  justReached,
  unifiedLevel,
  xpIntoLevel,
  xpForNextLevel,
  barPercent,
}: ProgressViewProps) {
  if (isMaxLevel) {
    return (
      <div className={styles.sealMark} aria-label="Max level reached">
        <span className={styles.sealMarkText}>
          <span className={styles.sealGlyph} aria-hidden="true">
            auto_awesome
          </span>
          Fully realized
          <span className={styles.sealGlyph} aria-hidden="true">
            auto_awesome
          </span>
        </span>
      </div>
    )
  }
  if (justReached) {
    return (
      <div className={styles.justReached} aria-label={`Level ${unifiedLevel} reached`}>
        <span className={styles.justReachedStamp}>
          <span className={styles.justReachedIcon} aria-hidden="true">
            check_circle
          </span>
          Lv {unifiedLevel} reached
        </span>
      </div>
    )
  }
  return (
    <div className={styles.barRow}>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpForNextLevel}
        aria-valuenow={xpIntoLevel}
        aria-label={`${xpIntoLevel} of ${xpForNextLevel} XP toward level ${unifiedLevel + 1}`}
      >
        <div className={styles.barFill} style={{ width: `${barPercent}%` }} />
      </div>
    </div>
  )
}

interface CrestStatsProps {
  isMaxLevel: boolean
  visitor: boolean
  completedSkills: number
  xpRemaining: number
  unifiedLevel: number
}

function CrestStats({
  isMaxLevel,
  visitor,
  completedSkills,
  xpRemaining,
  unifiedLevel,
}: CrestStatsProps) {
  if (isMaxLevel || visitor) {
    return (
      <div className={styles.stats}>
        <span>
          <b>{completedSkills} of 18</b> skills
        </span>
      </div>
    )
  }
  return (
    <div className={styles.stats}>
      <span>
        <b>{xpRemaining} XP</b> to Lv {unifiedLevel + 1}
      </span>
      <span className={styles.sep} aria-hidden="true">
        ·
      </span>
      <span>
        <b>{completedSkills}</b> of 18 skills
      </span>
    </div>
  )
}

export default function LevelCrest({ state, visitor = false }: LevelCrestProps) {
  const {
    unifiedLevel,
    classInfo,
    stakesPrefix,
    completedSkills,
    xpIntoLevel,
    xpForNextLevel,
    isMaxLevel,
  } = computeProgression(state)

  const celebrate = useLevelUpCelebration(unifiedLevel, classInfo.index, visitor)

  const barPercent = isMaxLevel ? 100 : (xpIntoLevel / xpForNextLevel) * 100
  const xpRemaining = xpForNextLevel - xpIntoLevel
  // At an exact level boundary (xpIntoLevel === 0) the bar would render empty,
  // misreading as "you haven't started". Swap it for a stamp that celebrates
  // the milestone instead.
  const justReached = !isMaxLevel && unifiedLevel >= 1 && xpIntoLevel === 0

  const classes = [styles.crest, celebrate ? styles.levelUp : '', isMaxLevel ? styles.maxState : '']
    .filter(Boolean)
    .join(' ')

  return (
    <section
      id="level-crest"
      className={classes}
      aria-label={visitor ? `Class: ${classInfo.name}` : `Your class: ${classInfo.name}`}
    >
      <span className={styles.levelSeal} aria-hidden="true">
        {isMaxLevel && (
          <span className={styles.sealIcon} aria-hidden="true">
            workspace_premium
          </span>
        )}
        Lv <span className={styles.levelSealNumber}>{unifiedLevel}</span>
      </span>

      <h2 className={styles.title}>
        {stakesPrefix && <span className={styles.prefix}>{stakesPrefix}</span>}
        <span className={styles.className}>{classInfo.name}</span>
      </h2>
      <p className={styles.tagline}>{classInfo.tagline}</p>

      {!visitor && (
        <ProgressView
          isMaxLevel={isMaxLevel}
          justReached={justReached}
          unifiedLevel={unifiedLevel}
          xpIntoLevel={xpIntoLevel}
          xpForNextLevel={xpForNextLevel}
          barPercent={barPercent}
        />
      )}

      <CrestStats
        isMaxLevel={isMaxLevel}
        visitor={visitor}
        completedSkills={completedSkills}
        xpRemaining={xpRemaining}
        unifiedLevel={unifiedLevel}
      />

      <LevelBreakdown state={state} />
    </section>
  )
}
