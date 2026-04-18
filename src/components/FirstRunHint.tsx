import styles from './FirstRunHint.module.css'

export default function FirstRunHint() {
  return (
    <div className={styles.hint} role="note">
      <p className={styles.headline}>
        <span className={styles.mark} aria-hidden="true">
          ✦
        </span>
        Tap a level that matches how you work today
        <span className={styles.mark} aria-hidden="true">
          ✦
        </span>
      </p>
      <p className={styles.sub}>Pick a path below. You can change your level any time.</p>
    </div>
  )
}
