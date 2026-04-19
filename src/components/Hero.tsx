import type { SkillState } from '../types/skill-tree'
import styles from './Hero.module.css'

interface HeroProps {
  state?: SkillState
  visitorName?: string
  visitorAvatarUrl?: string
  variant?: 'landing' | 'profile'
}

export default function Hero({ visitorName, visitorAvatarUrl, variant = 'landing' }: HeroProps) {
  const isVisitor = Boolean(visitorName)
  const isProfile = variant === 'profile' || isVisitor
  const heroClass = `${styles.hero} ${isProfile ? styles.heroProfile : ''}`
  const initial = visitorName?.[0]?.toUpperCase() ?? '?'

  return (
    <section className={heroClass}>
      {isVisitor &&
        (visitorAvatarUrl ? (
          <img
            src={visitorAvatarUrl}
            alt=""
            className={styles.visitorAvatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.visitorAvatarFallback} aria-hidden="true">
            {initial}
          </div>
        ))}
      <h1 className={styles.title}>
        {visitorName ? `${visitorName}\u2019s Agentic Skills` : 'Map Your Agentic Skills'}
      </h1>
      {!isProfile && (
        <p className={styles.subtitle}>
          Where are you with AI coding? Mark your level on each path — your class appears as you go.
        </p>
      )}
    </section>
  )
}
