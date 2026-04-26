import type { User } from 'firebase/auth'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useAuthActions } from '../hooks/useAuthActions'
import { computeProgression } from '../data/progression'
import { hasAnyProgress } from '../data/state'
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

interface LevelBadgeProps {
  state: SkillState
}

function scrollToCrest() {
  const crest = document.getElementById('level-crest')
  if (!crest) return
  crest.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function LevelBadge({ state }: LevelBadgeProps) {
  const { unifiedLevel, classInfo, stakesPrefix, title } = computeProgression(state)
  return (
    <button
      type="button"
      className={styles.levelBadge}
      aria-label={`Level ${unifiedLevel}, ${title}. Jump to class details.`}
      onClick={scrollToCrest}
    >
      <span className={styles.levelSeal}>
        <span className={styles.levelSealLabel}>Lv</span>
        <span className={styles.levelSealNumber}>{unifiedLevel}</span>
      </span>
      <span className={styles.levelClass}>
        {stakesPrefix && (
          <em className={styles.levelPrefix} aria-hidden="true">
            {stakesPrefix}
          </em>
        )}
        <span className={styles.levelClassName}>{classInfo.name}</span>
      </span>
    </button>
  )
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

export default function Header({ syncStatus = 'idle', mode = 'landing', state }: HeaderProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const {
    isModalOpen,
    openModal,
    closeModal,
    isConfirmOpen,
    handleSignOut,
    confirmSignOut,
    closeConfirm,
  } = useAuthActions()

  const handleLogoClick = (e: React.MouseEvent) => {
    // Mobile: logo taps scroll to the top of the current page instead of navigating,
    // since mobile browsers lack a scroll-thumb affordance. Desktop keeps Link nav.
    if (typeof window !== 'undefined' && window.innerWidth <= 560) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // On desktop, if we're already on the home route, also scroll up rather than no-op.
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
      <Link
        to="/"
        className={styles.logoLockup}
        aria-label="Plepic Skill home"
        onClick={handleLogoClick}
      >
        <svg
          className={styles.logoButterfly}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 300 280"
          width="28"
          height="26"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <polygon
            points="147,105 110,68 55,48"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon points="147,105 55,48 20,72" fill="#00c638" stroke="#00c638" strokeWidth="0.5" />
          <polygon
            points="147,105 20,72 15,108"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="147,130 147,105 15,108"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="147,130 15,108 28,150"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="147,165 147,130 28,150"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="147,165 28,150 50,178"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="147,178 50,178 82,195"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="147,178 82,195 75,220"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="147,195 75,220 100,240"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="147,195 100,240 135,232"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="153,105 190,68 245,48"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="153,105 245,48 280,72"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="153,105 280,72 285,108"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="153,130 153,105 285,108"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="153,130 285,108 272,150"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="153,165 153,130 272,150"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="153,165 272,150 250,178"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <polygon
            points="153,178 250,178 218,195"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="153,178 218,195 225,220"
            fill="#00c638"
            stroke="#00c638"
            strokeWidth="0.5"
          />
          <polygon
            points="153,195 225,220 200,240"
            fill="#137b30"
            stroke="#137b30"
            strokeWidth="0.5"
          />
          <polygon
            points="153,195 200,240 165,232"
            fill="#0d5822"
            stroke="#0d5822"
            strokeWidth="0.5"
          />
          <path d="M150,92 C158,120 158,150 150,200 C142,150 142,120 150,92Z" fill="#0d5822" />
          <path
            d="M150,86 C146,72 140,55 136,42"
            fill="none"
            stroke="#0d5822"
            strokeWidth="1.8"
            opacity="0.7"
          />
          <path
            d="M150,86 C154,72 160,55 164,42"
            fill="none"
            stroke="#0d5822"
            strokeWidth="1.8"
            opacity="0.7"
          />
          <circle cx="136" cy="41" r="3.5" fill="#00c638" />
          <circle cx="164" cy="41" r="3.5" fill="#00c638" />
          <circle cx="150" cy="90" r="8" fill="#e26c45" stroke="#e26c45" strokeWidth="0.8" />
        </svg>
        <span className={styles.logoWordmark}>Plepic</span>
        <span className={styles.logoSuffix} aria-hidden="true">
          Skill
        </span>
      </Link>
      {state && hasAnyProgress(state) && mode !== 'visitor' && <LevelBadge state={state} />}
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
