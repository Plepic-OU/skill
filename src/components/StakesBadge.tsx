import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './StakesBadge.module.css'

export default function StakesBadge({ zoneId }: { zoneId: SafetyZoneId }) {
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
