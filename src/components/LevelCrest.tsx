import { useEffect, useRef, useState } from 'react'
import { computeProgression } from '../data/progression'
import type { SkillState } from '../types/skill-tree'
import styles from './LevelCrest.module.css'

interface LevelCrestProps {
  state: SkillState
  visitor?: boolean
}

export default function LevelCrest({ state, visitor }: LevelCrestProps) {
  const progression = computeProgression(state)
  const {
    unifiedLevel,
    classInfo,
    stakesPrefix,
    title,
    completedSkills,
    totalXp,
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

  return (
    <section
      className={`${styles.crest} ${celebrate ? styles.levelUp : ''}`}
      aria-label={visitor ? `Class: ${title}` : `Your class: ${title}`}
    >
      <div className={styles.titleRow}>
        <span className={styles.levelPill} aria-label={`Unified level ${unifiedLevel} of 6`}>
          Lv <span className={styles.levelPillNumber}>{unifiedLevel}</span>
        </span>
        <h2 className={styles.title}>
          {stakesPrefix && <span className={styles.prefix}>{stakesPrefix} </span>}
          {classInfo.name}
        </h2>
      </div>
      <p className={styles.tagline}>{classInfo.tagline}</p>

      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpForNextLevel}
        aria-valuenow={xpIntoLevel}
        aria-label={
          isMaxLevel
            ? 'Max level reached'
            : `${xpIntoLevel} of ${xpForNextLevel} XP toward next level`
        }
      >
        <div
          className={`${styles.barFill} ${isMaxLevel ? styles.barFillMax : ''}`}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <div className={styles.stats}>
        <span>
          <b>{completedSkills}</b>/18 skills
        </span>
        <span>
          <b>{totalXp}</b> XP
        </span>
        {!isMaxLevel ? (
          <span>
            <b>{xpForNextLevel - xpIntoLevel}</b> XP to Lv {unifiedLevel + 1}
          </span>
        ) : (
          <span>
            <b>Max level</b>
          </span>
        )}
      </div>
    </section>
  )
}
