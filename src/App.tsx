import { Routes, Route, Navigate } from 'react-router'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import Toast from './components/Toast'
import { usePageViewTracking } from './hooks/usePageViewTracking'
import { FOOTER_LINKS, MAIN_SITE } from './data/links'
import styles from './App.module.css'

export default function App() {
  usePageViewTracking()

  return (
    <div className={styles.app}>
      <a href="#questMap" className="skip-link">
        Skip to skill tree
      </a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* The header's back-link is hidden on narrow phones, so on mobile this
          footer is the only route back to plepic.com. It carries the main
          site's own nav rather than a single credit line. */}
      <footer className={styles.footer}>
        <nav className={styles.footerNav} aria-label="Plepic main site">
          <a href={MAIN_SITE}>plepic.com</a>
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href="https://github.com/Plepic-OU/skill" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
        <p className={styles.footerNote}>
          Built by <a href={MAIN_SITE}>Plepic</a> &middot; Curious play. Epic growth.
        </p>
      </footer>
      <Toast />
    </div>
  )
}
