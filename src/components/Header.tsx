import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../data/auth'
import SignInModal from './SignInModal'
import ConfirmDialog from './ConfirmDialog'
import ShareButton from './ShareButton'
import styles from './Header.module.css'

interface HeaderProps {
  syncStatus?: 'idle' | 'syncing' | 'saved' | 'error'
  mode?: 'landing' | 'owner' | 'visitor'
}

export default function Header({ syncStatus = 'idle', mode = 'landing' }: HeaderProps) {
  const { user, loading } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleSignOut() {
    setConfirmOpen(true)
  }

  function confirmSignOut() {
    setConfirmOpen(false)
    signOut()
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>P</div>
          Agentic Skills
        </Link>
      </div>
      <div className={styles.authArea}>
        {loading ? null : user ? (
          <div className={styles.userInfo}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {user.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className={styles.displayName} title={user.displayName ?? undefined}>
              {user.displayName ?? 'Anonymous'}
            </span>
            {mode === 'owner' && syncStatus === 'saved' && (
              <span className={styles.syncBadge} aria-label="Progress saved">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3 7.5L5.5 10L11 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Saved
              </span>
            )}
            {mode === 'owner' && syncStatus === 'syncing' && (
              <span className={styles.syncBadge} aria-label="Saving...">
                Saving...
              </span>
            )}
            {mode === 'owner' && <ShareButton />}
            {mode === 'visitor' && (
              <Link to={`/profile/${user.uid}`} className={styles.btnViewProfile}>
                View your profile
              </Link>
            )}
            <button className={styles.btnSignOut} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            {mode === 'visitor' && (
              <Link to="/" className={styles.btnViewProfile}>
                Assess your own skills
              </Link>
            )}
            <button className={styles.btnLogin} onClick={() => setModalOpen(true)}>
              {mode === 'landing' ? 'Sign in to save' : 'Sign in'}
            </button>
            <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Sign out?"
        message="Your progress is saved and will be here when you return."
        confirmLabel="Sign out"
        onConfirm={confirmSignOut}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  )
}
