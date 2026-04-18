import styles from './FirstRunHint.module.css'

export default function FirstRunHint() {
  return (
    <p className={styles.hint} role="note">
      <span className={styles.mark} aria-hidden="true">
        ✦
      </span>
      Tap any level that matches how you work today
      <span className={styles.mark} aria-hidden="true">
        ✦
      </span>
    </p>
  )
}
