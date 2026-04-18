import type { User } from 'firebase/auth'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useAuthActions } from '../hooks/useAuthActions'
import SignInModal from './SignInModal'
import ConfirmDialog from './ConfirmDialog'
import ShareButton from './ShareButton'
import type { SyncStatus } from '../types/skill-tree'
import { LinkIcon } from './icons'
import styles from './Header.module.css'

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
      <button className={styles.btnShare} onClick={onSignIn} aria-label="Share">
        <LinkIcon />
        <span className={styles.btnShareLabel}>Share</span>
      </button>
      <button className={styles.btnLogin} onClick={onSignIn}>
        <span className={styles.btnLoginFull}>Sign in to save</span>
        <span className={styles.btnLoginShort}>Sign in</span>
      </button>
    </>
  )
}

export default function Header({ syncStatus = 'idle', mode = 'landing' }: HeaderProps) {
  const { user, loading } = useAuth()
  const {
    isModalOpen,
    openModal,
    closeModal,
    isConfirmOpen,
    handleSignOut,
    confirmSignOut,
    closeConfirm,
  } = useAuthActions()

  function renderAuthControls() {
    if (loading) return null

    switch (mode) {
      case 'owner':
        return user ? <OwnerControls syncStatus={syncStatus} onSignOut={handleSignOut} /> : null
      case 'visitor':
        return <VisitorControls user={user} onSignOut={handleSignOut} onSignIn={openModal} />
      case 'landing':
        if (user) {
          return (
            <button className={styles.btnSignOut} onClick={handleSignOut}>
              Sign out
            </button>
          )
        }
        return <LandingControls onSignIn={openModal} />
      default:
        return !user ? (
          <button className={styles.btnLogin} onClick={openModal}>
            Sign in
          </button>
        ) : null
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>P</div>
          <span className={styles.logoWordmark}>Agentic Skills</span>
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
          </div>
        )}
        {renderAuthControls()}
      </div>
      <SignInModal open={isModalOpen} onClose={closeModal} />
      <ConfirmDialog
        open={isConfirmOpen}
        title="Sign out?"
        message="Your progress is saved and will be here when you return."
        confirmLabel="Sign out"
        onConfirm={confirmSignOut}
        onCancel={closeConfirm}
      />
    </header>
  )
}
