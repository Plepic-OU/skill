import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import SkillTreeLayout from '../components/SkillTreeLayout'

function LandingContent() {
  const { state, handleClaim, handleUnclaim, handleSafetyZone } = useSkillState()

  return (
    <SkillTreeLayout
      headerMode="landing"
      state={state}
      onClaim={handleClaim}
      onUnclaim={handleUnclaim}
      onSafetyZone={handleSafetyZone}
    />
  )
}

export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Redirect to profile when logged in
  useEffect(() => {
    if (user) {
      navigate(`/profile/${user.uid}`, { replace: true })
    }
  }, [user, navigate])

  // Suppress landing content while auth is resolving or redirect is pending
  if (loading || user) return null

  return <LandingContent />
}
