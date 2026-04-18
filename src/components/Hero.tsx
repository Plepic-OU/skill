import type { SkillState } from '../types/skill-tree'
import styles from './Hero.module.css'

interface HeroProps {
  state?: SkillState
  visitorName?: string
  variant?: 'landing' | 'profile'
}

export default function Hero({ visitorName, variant = 'landing' }: HeroProps) {
  const isVisitor = Boolean(visitorName)
  const isProfile = variant === 'profile' || isVisitor
  const heroClass = `${styles.hero} ${isProfile ? styles.heroProfile : ''}`

  return (
    <section className={heroClass}>
      <h1 className={styles.title}>
        {visitorName ? `${visitorName}\u2019s Agentic Skills` : 'Map Your Agentic Skills'}
      </h1>
      {!isProfile && (
        <p className={styles.subtitle}>
          Self-assess how you code with AI. Claim your level — your class appears as you go.
        </p>
      )}
      {isVisitor && (
        <p className={styles.visitorExplainer}>A self-assessment of agentic coding skills.</p>
      )}
    </section>
  )
}
