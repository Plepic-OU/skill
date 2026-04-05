import { useState } from 'react'
import styles from './Header.module.css'

export default function Header() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>P</div>
        Agentic Skills
      </div>
      <div className={styles.loginWrap}>
        <button
          className={styles.btnLogin}
          onClick={() => setShowTooltip((s) => !s)}
          onBlur={() => setShowTooltip(false)}
        >
          Log in to save
        </button>
        {showTooltip && <div className={styles.tooltip}>Coming soon</div>}
      </div>
    </header>
  )
}
