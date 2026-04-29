import type { User } from 'firebase/auth'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useAuthActions } from '../hooks/useAuthActions'
import { hasAnyProgress } from '../data/state'
import LevelBadge from './LevelBadge'
import PlepicLogo from './PlepicLogo'
import SignInModal from './SignInModal'
import ConfirmDialog from './ConfirmDialog'
import ShareButton from './ShareButton'
import type { SkillState, SyncStatus } from '../types/skill-tree'
import styles from './Header.module.css'

interface HeaderProps {
  syncStatus?: SyncStatus
  mode?: 'landing' | 'owner' | 'visitor'
  state?: SkillState
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
      <Link to="/" className={styles.btnAssess}>
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
        <span className={`material-symbols-rounded ${styles.btnShareIcon}`} aria-hidden="true">
          share
        </span>
        <span className={styles.btnShareLabel}>Share</span>
      </button>
      <button className={styles.btnLogin} onClick={onSignIn}>
        <span className={styles.btnLoginFull}>Sign in to save</span>
        <span className={styles.btnLoginShort}>Sign in</span>
      </button>
    </>
  )
}

interface UserChipProps {
  user: User
}

function UserChip({ user }: UserChipProps) {
  return (
    <div className={styles.userInfo}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
      ) : (
        <div className={styles.avatarFallback} data-testid="user-avatar">
          {user.displayName?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <span className={styles.displayName} title={user.displayName ?? undefined}>
        {user.displayName ?? 'Anonymous'}
      </span>
    </div>
  )
}

interface AuthControlsProps {
  mode: 'landing' | 'owner' | 'visitor'
  user: User | null
  syncStatus: SyncStatus
  onSignOut: () => void
  onSignIn: () => void
}

function AuthControls({ mode, user, syncStatus, onSignOut, onSignIn }: AuthControlsProps) {
  switch (mode) {
    case 'owner':
      return user ? <OwnerControls syncStatus={syncStatus} onSignOut={onSignOut} /> : null
    case 'visitor':
      return <VisitorControls user={user} onSignOut={onSignOut} onSignIn={onSignIn} />
    case 'landing':
      if (user) {
        return (
          <button className={styles.btnSignOut} onClick={onSignOut}>
            Sign out
          </button>
        )
      }
      return <LandingControls onSignIn={onSignIn} />
  }
}

export default function Header({ syncStatus = 'idle', mode = 'landing', state }: HeaderProps) {
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

  const showLevelBadge = state && hasAnyProgress(state) && mode !== 'visitor'

  return (
    <header className={styles.header}>
      <PlepicLogo />
      {showLevelBadge && <LevelBadge state={state} />}
      <div className={styles.authArea}>
        {!loading && user && <UserChip user={user} />}
        {!loading && (
          <AuthControls
            mode={mode}
            user={user}
            syncStatus={syncStatus}
            onSignOut={handleSignOut}
            onSignIn={openModal}
          />
        )}
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
