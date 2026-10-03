import type { SkillState } from '../types/skill-tree'
import styles from './Hero.module.css'

interface HeroProps {
  state?: SkillState
  visitorName?: string
  visitorAvatarUrl?: string
  variant?: 'landing' | 'profile' | 'shared'
}

export default function Hero({ visitorName, visitorAvatarUrl, variant = 'landing' }: HeroProps) {
  const isVisitor = Boolean(visitorName)

  if (isVisitor) {
    const initial = visitorName?.[0]?.toUpperCase() ?? '?'
    return (
      <section className={`${styles.hero} ${styles.heroVisitor}`}>
        <div className={styles.visitorIdentity}>
          {visitorAvatarUrl ? (
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
          )}
          <h1 className={styles.visitorName}>{visitorName}</h1>
        </div>
      </section>
    )
  }

  if (variant === 'shared') {
    return (
      <section className={`${styles.hero} ${styles.heroShared}`}>
        <h1 className={styles.title}>A shared skill map</h1>
        <p className={styles.subtitle}>Someone mapped their agentic coding skills.</p>
        <p className={styles.subtitleHint}>This is where they stand. Map your own in a minute.</p>
      </section>
    )
  }

  const isProfile = variant === 'profile'
  const heroClass = `${styles.hero} ${isProfile ? styles.heroProfile : ''}`

  return (
    <section className={heroClass}>
      <h1 className={styles.title}>Map Your Agentic Skills</h1>
      {!isProfile && (
        <>
          <p className={styles.subtitle}>Where are you with AI coding?</p>
          <p className={styles.subtitleHint}>
            Mark your level on each path. Your class appears as you go.
          </p>
        </>
      )}
    </section>
  )
}
