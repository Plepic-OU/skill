import { render, screen } from '@testing-library/react'
import LevelCrest from '../LevelCrest'
import type { SkillState } from '../../types/skill-tree'
import styles from '../LevelCrest.module.css'

// Class threshold is 4 on any axis (progression.ts). These states keep the
// unified level constant at 2 (700 vs 800 XP) so class changes can be tested
// in isolation from level-ups.
const apprentice: SkillState = {
  autonomy: 2,
  parallelExecution: 2,
  skillUsage: 3,
  safetyZone: 'sandbox',
}
const toolsmith: SkillState = { ...apprentice, skillUsage: 4 }

// 800 → 900 XP crosses the level-3 boundary without changing class.
const level2: SkillState = {
  autonomy: 3,
  parallelExecution: 3,
  skillUsage: 2,
  safetyZone: 'sandbox',
}
const level3: SkillState = { ...level2, skillUsage: 3 }

function getCrest() {
  return screen.getByRole('region', { name: /class:/i })
}

describe('LevelCrest celebration', () => {
  it('celebrates when a claim levels you up', () => {
    const { rerender } = render(<LevelCrest state={level2} />)
    rerender(<LevelCrest state={level3} />)
    expect(getCrest()).toHaveClass(styles.levelUp)
  })

  it('celebrates when a claim unlocks a new class', () => {
    const { rerender } = render(<LevelCrest state={apprentice} />)
    rerender(<LevelCrest state={toolsmith} />)
    expect(getCrest()).toHaveClass(styles.levelUp)
  })

  it('does not celebrate when stepping back demotes your class', () => {
    const { rerender } = render(<LevelCrest state={toolsmith} />)
    rerender(<LevelCrest state={apprentice} />)
    expect(getCrest()).not.toHaveClass(styles.levelUp)
  })

  it('does not celebrate on the visitor view', () => {
    const { rerender } = render(<LevelCrest state={apprentice} visitor />)
    rerender(<LevelCrest state={toolsmith} visitor />)
    expect(getCrest()).not.toHaveClass(styles.levelUp)
  })
})
