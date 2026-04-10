import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import { useSyncState } from '../hooks/useSyncState'
import { useOwnerRedirect } from '../hooks/useOwnerRedirect'
import { usePublicProfile } from '../hooks/usePublicProfile'
import Header from '../components/Header'
import SkillTreeLayout from '../components/SkillTreeLayout'
import { showToast } from '../components/Toast'
import styles from './ProfilePage.module.css'

function OwnerProfile() {
  const { state, replaceState, handleClaim, handleUnclaim, handleSafetyZone } = useSkillState()
  const { syncStatus, syncError, clearSyncError } = useSyncState(state, replaceState)

  useEffect(() => {
    if (syncError) {
      showToast(syncError, 'error')
      clearSyncError()
    }
  }, [syncError, clearSyncError])

  return (
    <SkillTreeLayout
      headerMode="owner"
      syncStatus={syncStatus}
      state={state}
      onClaim={handleClaim}
      onUnclaim={handleUnclaim}
      onSafetyZone={handleSafetyZone}
    />
  )
}

function VisitorProfile({ userId }: { userId: string | undefined }) {
  const { profile, loading, error } = usePublicProfile(userId)

  if (loading) {
    return (
      <>
        <Header mode="visitor" />
        <div className={styles.visitorMessage}>
          <p>Loading profile...</p>
        </div>
      </>
    )
  }

  if (error || !profile) {
    return (
      <>
        <Header mode="visitor" />
        <div className={styles.visitorMessage}>
          <h2>Profile not found</h2>
          <p>This profile doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <Link to="/" className={styles.ctaLink}>
            Assess your own skills
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles.profileBanner}>
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className={styles.bannerAvatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.bannerAvatarFallback}>
            {profile.displayName[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <h2 className={styles.bannerName}>{profile.displayName}</h2>
      </div>
      <SkillTreeLayout
        headerMode="visitor"
        state={profile}
        readOnly
        visitorName={profile.displayName}
      />
    </>
  )
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user, loading } = useAuth()
  const { resetState } = useSkillState()

  useOwnerRedirect(user, loading, userId, resetState)

  const isOwner = user?.uid === userId

  if (loading) return null
  if (isOwner) return <OwnerProfile />
  return <VisitorProfile userId={userId} />
}
