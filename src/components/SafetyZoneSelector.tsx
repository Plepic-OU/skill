import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './SafetyZoneSelector.module.css'

const ZONE_IDS: SafetyZoneId[] = ['sandbox', 'normal', 'hardcore', 'impossible']

interface SafetyZoneSelectorProps {
  selected: SafetyZoneId
  onSelect: (zone: SafetyZoneId) => void
}

function getZoneStyle(
  isActive: boolean,
  zone: { color: string; activeText: string },
): React.CSSProperties {
  // Active pill fills with the zone colour (the Sandbox→Impossible green
  // progression: light → vivid → brand → dark), with an explicit activeText
  // paired to each for WCAG AA. Inactive pills keep Plepic's near-black text
  // on a white surface, carrying their identity via the zone-coloured border.
  return {
    '--zone-color': zone.color,
    borderColor: zone.color,
    color: isActive ? zone.activeText : 'var(--text)',
    background: isActive ? zone.color : 'var(--surface)',
    boxShadow: isActive ? `0 3px 12px ${zone.color}4d` : 'none',
    fontWeight: isActive ? 700 : 600,
  } as React.CSSProperties
}

// One compact row above the paths: the stakes are the context an answer is
// given in, so they come first, but they must not push the tree out of the
// first viewport. Desktop keeps label and pills on one line.
export default function SafetyZoneSelector({ selected, onSelect }: SafetyZoneSelectorProps) {
  const zones = skillTreeData.safety.zones

  return (
    <section className={styles.stakes} aria-labelledby="stakes-heading">
      <p className={styles.label}>
        <span id="stakes-heading" className={styles.heading}>
          Stakes
        </span>
        First, how costly is a mistake in the work you are rating yourself on?
      </p>
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
              style={getZoneStyle(isActive, zone)}
            >
              <span className={`material-symbols-rounded ${styles.btnIcon}`} aria-hidden="true">
                {zone.icon}
              </span>
              <span className={styles.btnLabel}>{zone.label}</span>
              <span className={styles.btnHint}>{zone.hint}</span>
            </button>
          )
        })}
      </div>
      <p className={styles.desc}>
        <span className={styles.hint}>
          The right level of autonomy depends on it. It flavors your title; XP and level are
          unaffected.
        </span>{' '}
        {zones[selected].desc}
      </p>
    </section>
  )
}
