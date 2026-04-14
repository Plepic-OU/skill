import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './SafetyZoneBadge.module.css'

export default function SafetyZoneBadge({ zoneId }: { zoneId: SafetyZoneId }) {
  const zone = skillTreeData.safety.zones[zoneId]
  return (
    <div className={styles.stakesBadge}>
      <span className={styles.stakesBadgeTitle}>Stakes</span>
      <span className={styles.stakesDot} style={{ background: zone.color }} />
      <span className={styles.stakesLabel}>{zone.label}</span>
      <span className={styles.stakesDesc}>{zone.desc}</span>
    </div>
  )
}
