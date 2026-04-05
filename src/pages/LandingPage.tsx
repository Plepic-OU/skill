import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSkillState } from '../hooks/useSkillState'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SafetyZoneSelector from '../components/SafetyZoneSelector'
import SkillTree from '../components/SkillTree'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { state, handleClaim, handleUnclaim, handleSafetyZone } = useSkillState()

  // Redirect to profile when logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(`/profile/${user.uid}`, { replace: true })
    }
  }, [user, loading, navigate])

  // Don't render landing content if we're about to redirect
  if (!loading && user) return null

  return (
    <>
      <Header />
      <Hero state={state} />
      <SafetyZoneSelector selected={state.safetyZone} onSelect={handleSafetyZone} />
      <SkillTree state={state} onClaim={handleClaim} onUnclaim={handleUnclaim} />
    </>
  )
}
