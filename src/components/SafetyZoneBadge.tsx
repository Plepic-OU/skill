import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './SafetyZoneBadge.module.css'

interface SafetyZoneBadgeProps {
  zoneId: SafetyZoneId
  visitor?: boolean
}

export default function SafetyZoneBadge({ zoneId, visitor }: SafetyZoneBadgeProps) {
  const zone = skillTreeData.safety.zones[zoneId]
  // On visitor view the long desc ("Mistake stops your service for your users…")
  // reads as owner-voice advice. Swap it for the terse third-person hint which
  // works equally well as "this is where they operate" context.
  const caption = visitor ? zone.hint : zone.desc
  return (
    <div className={styles.stakesBadge}>
      <span className={styles.stakesBadgeTitle}>Stakes</span>
      <span className={styles.stakesDot} style={{ background: zone.color }} />
      <span className={styles.stakesLabel}>{zone.label}</span>
      <span className={styles.stakesDesc}>{caption}</span>
    </div>
  )
}
