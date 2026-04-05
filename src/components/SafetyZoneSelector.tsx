import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './SafetyZoneSelector.module.css'

const ZONE_IDS: SafetyZoneId[] = ['sandbox', 'normal', 'hardcore', 'impossible']

interface SafetyZoneSelectorProps {
  selected: SafetyZoneId
  onSelect: (zone: SafetyZoneId) => void
}

export default function SafetyZoneSelector({ selected, onSelect }: SafetyZoneSelectorProps) {
  const zones = skillTreeData.safety.zones

  return (
    <section className={styles.safetyZone}>
      <div className={styles.heading}>Stakes</div>
      <div className={styles.label}>What's at stake in your environment?</div>
      <div className={styles.options} role="radiogroup" aria-label="Stakes selection">
        {ZONE_IDS.map((id) => {
          const zone = zones[id]
          const isActive = selected === id
          return (
            <button
              key={id}
              className={styles.btn}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(id)}
              style={
                {
                  '--zone-color': zone.color,
                  borderColor: zone.color,
                  color: isActive ? 'white' : zone.color,
                  background: isActive ? zone.color : 'transparent',
                  boxShadow: isActive ? `0 3px 12px ${zone.color}4d` : 'none',
                  transform: isActive ? 'scale(1.05)' : 'none',
                  fontWeight: isActive ? 700 : 600,
                } as React.CSSProperties
              }
            >
              <span className={`material-symbols-rounded ${styles.btnIcon}`}>{zone.icon}</span>
              <span className={styles.btnLabel}>{zone.label}</span>
              <span className={styles.btnHint}>{zone.hint}</span>
            </button>
          )
        })}
      </div>
      <div className={styles.desc}>{zones[selected].desc}</div>
    </section>
  )
}
