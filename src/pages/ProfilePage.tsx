import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import { useSyncState } from '../hooks/useSyncState'
import { DEFAULT_STATE, saveState } from '../data/state'
import { readPublicProfile } from '../data/sync'
import type { PublicProfile } from '../data/sync'
import Header from '../components/Header'
import Hero from '../components/Hero'
import StakesSelector from '../components/StakesSelector'
import SkillTree from '../components/SkillTree'
import { skillTreeData } from '../data/skill-trees'
import type { SafetyZoneId } from '../types/skill-tree'
import styles from './ProfilePage.module.css'

function StakesBadge({ zoneId }: { zoneId: SafetyZoneId }) {
  const zone = skillTreeData.safety.zones[zoneId]
  return (
    <div className={styles.stakesBadge}>
      <span className={styles.stakesBadgeTitle}>Stakes</span>
      <span className={styles.stakesDot} style={{ background: zone.color }} />
      <span className={styles.stakesLabel}>{zone.label}</span>
      <span className={styles.stakesDesc}>{zone.desc}</span>
    </div>
  )
}

function OwnerProfile() {
  const { state, setState, handleClaim, handleUnclaim, handleStakes } = useSkillState()
  const syncStatus = useSyncState(state, setState)

  return (
    <>
      <Header syncStatus={syncStatus} mode="owner" />
      <Hero state={state} />
      <StakesSelector selected={state.safetyZone} onSelect={handleStakes} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
    </>
  )
}

function VisitorProfile({ userId }: { userId: string | undefined }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setError(true)
      return
    }
    setLoading(true)
    setError(false)
    readPublicProfile(userId)
      .then((p) => {
        setProfile(p)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [userId])

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
      <Header mode="visitor" />
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
      <Hero state={profile} visitorName={profile.displayName} />
      <StakesBadge zoneId={profile.safetyZone} />
      <SkillTree state={profile} readonly />
    </>
  )
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const wasOwner = useRef(false)

  const isOwner = user?.uid === userId

  // Redirect to landing when owner signs out
  useEffect(() => {
    if (isOwner) {
      wasOwner.current = true
    } else if (wasOwner.current && !loading) {
      wasOwner.current = false
      saveState({ ...DEFAULT_STATE })
      navigate('/', { replace: true })
    }
  }, [isOwner, loading, navigate])

  if (loading) return null
  if (isOwner) return <OwnerProfile />
  return <VisitorProfile userId={userId} />
}
