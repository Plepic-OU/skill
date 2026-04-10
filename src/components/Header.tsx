import { useState } from 'react'
import { Link } from 'react-router'
import type { User } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../data/auth'
import SignInModal from './SignInModal'
import ConfirmDialog from './ConfirmDialog'
import ShareButton, { LinkIcon } from './ShareButton'
import styles from './Header.module.css'

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error'

interface HeaderProps {
  syncStatus?: SyncStatus
  mode?: 'landing' | 'owner' | 'visitor'
}

interface OwnerControlsProps {
  syncStatus: SyncStatus
  onSignOut: () => void
}

function OwnerControls({ syncStatus, onSignOut }: OwnerControlsProps) {
  return (
    <>
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
      <ShareButton />
      <button className={styles.btnSignOut} onClick={onSignOut}>
        Sign out
      </button>
    </>
  )
}

interface VisitorControlsProps {
  user: User | null
  onSignOut: () => void
  onSignIn: () => void
}

function VisitorControls({ user, onSignOut, onSignIn }: VisitorControlsProps) {
  if (user) {
    return (
      <>
        <Link to={`/profile/${user.uid}`} className={styles.btnViewProfile}>
          View your profile
        </Link>
        <button className={styles.btnSignOut} onClick={onSignOut}>
          Sign out
        </button>
      </>
    )
  }
  return (
    <>
      <Link to="/" className={styles.btnLogin}>
        Assess your own skills
      </Link>
      <button className={styles.btnSignInSecondary} onClick={onSignIn}>
        Sign in
      </button>
    </>
  )
}

interface LandingControlsProps {
  onSignIn: () => void
}

function LandingControls({ onSignIn }: LandingControlsProps) {
  return (
    <>
      <button className={styles.btnShare} onClick={onSignIn}>
        <LinkIcon />
        Share
      </button>
      <button className={styles.btnLogin} onClick={onSignIn}>
        Sign in to save
      </button>
    </>
  )
}

export default function Header({ syncStatus = 'idle', mode = 'landing' }: HeaderProps) {
  const { user, loading } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  function handleSignOut() {
    setIsConfirmOpen(true)
  }

  function confirmSignOut() {
    setIsConfirmOpen(false)
    signOut()
  }

  function openModal() {
    setIsModalOpen(true)
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
        {!loading && user && (
          <div className={styles.userInfo}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback} data-testid="user-avatar">
                {user.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className={styles.displayName} title={user.displayName ?? undefined}>
              {user.displayName ?? 'Anonymous'}
            </span>
            {mode === 'owner' && (
              <OwnerControls syncStatus={syncStatus} onSignOut={handleSignOut} />
            )}
            {mode === 'visitor' && (
              <VisitorControls user={user} onSignOut={handleSignOut} onSignIn={openModal} />
            )}
            {mode === 'landing' && (
              <button className={styles.btnSignOut} onClick={handleSignOut}>
                Sign out
              </button>
            )}
          </div>
        )}
        {!loading && !user && (
          <>
            {mode === 'landing' && <LandingControls onSignIn={openModal} />}
            {mode === 'visitor' && (
              <VisitorControls user={null} onSignOut={handleSignOut} onSignIn={openModal} />
            )}
            {mode !== 'landing' && mode !== 'visitor' && (
              <button className={styles.btnLogin} onClick={openModal}>
                Sign in
              </button>
            )}
            <SignInModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </>
        )}
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        title="Sign out?"
        message="Your progress is saved and will be here when you return."
        confirmLabel="Sign out"
        onConfirm={confirmSignOut}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </header>
  )
}
