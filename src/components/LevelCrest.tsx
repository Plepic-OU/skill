import { useEffect, useRef, useState } from 'react'
import { computeProgression } from '../data/progression'
import { skillTreeData } from '../data/skill-trees'
import type { AxisId, SkillState } from '../types/skill-tree'
import styles from './LevelCrest.module.css'

const AXIS_IDS = Object.keys(skillTreeData.axes) as AxisId[]

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

function renderProgress({
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

export default function LevelCrest({ state, visitor }: LevelCrestProps) {
  const progression = computeProgression(state)
  const {
    unifiedLevel,
    classInfo,
    stakesPrefix,
    completedSkills,
    xpIntoLevel,
    xpForNextLevel,
    isMaxLevel,
  } = progression

  const [celebrate, setCelebrate] = useState(false)
  const prevLevelRef = useRef<number | null>(null)
  const prevClassRef = useRef<number | null>(null)

  useEffect(() => {
    const prevLevel = prevLevelRef.current
    const prevClass = prevClassRef.current
    const levelledUp = prevLevel !== null && unifiedLevel > prevLevel
    const classChanged = prevClass !== null && classInfo.index !== prevClass
    if (!visitor && (levelledUp || classChanged)) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 900)
      prevLevelRef.current = unifiedLevel
      prevClassRef.current = classInfo.index
      return () => clearTimeout(t)
    }
    prevLevelRef.current = unifiedLevel
    prevClassRef.current = classInfo.index
  }, [unifiedLevel, classInfo.index, visitor])

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

      {renderProgress({
        isMaxLevel,
        justReached,
        unifiedLevel,
        xpIntoLevel,
        xpForNextLevel,
        barPercent,
      })}

      <div className={styles.stats}>
        {isMaxLevel ? (
          <span>
            <b>{completedSkills} of 18</b> skills
          </span>
        ) : (
          <>
            <span>
              <b>{xpRemaining} XP</b> to Lv {unifiedLevel + 1}
            </span>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <span>
              <b>{completedSkills}</b> of 18 skills
            </span>
          </>
        )}
      </div>

      <div className={styles.breakdown} aria-live="polite">
        <span className={styles.breakdownLabel}>By path</span>
        <div className={styles.breakdownRow}>
          {AXIS_IDS.map((id) => {
            const axis = skillTreeData.axes[id]
            return (
              <span key={id} className={styles.breakdownItem}>
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
    </section>
  )
}
