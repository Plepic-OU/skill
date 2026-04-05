import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../data/auth'
import SignInModal from './SignInModal'
import ConfirmDialog from './ConfirmDialog'
import styles from './Header.module.css'

interface HeaderProps {
  syncStatus?: 'idle' | 'syncing' | 'saved' | 'error'
}

export default function Header({ syncStatus = 'idle' }: HeaderProps) {
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
        <div className={styles.logoIcon}>P</div>
        Agentic Skills
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
            {syncStatus === 'saved' && (
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
            {syncStatus === 'syncing' && (
              <span className={styles.syncBadge} aria-label="Saving...">
                Saving...
              </span>
            )}
            <button className={styles.btnSignOut} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <button className={styles.btnLogin} onClick={() => setModalOpen(true)}>
              Sign in to save
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
