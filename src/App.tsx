import { Routes, Route, Navigate } from 'react-router'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import Toast from './components/Toast'
import styles from './App.module.css'

export default function App() {
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
      <footer className={styles.footer}>
        Built by <strong>Plepic</strong> &mdash; helping developers level up with AI &middot;{' '}
        <a href="https://github.com/Plepic-OU/skill" target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </footer>
      <Toast />
    </div>
  )
}
