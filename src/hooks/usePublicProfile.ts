import { useEffect, useState } from 'react'
import { readPublicProfile } from '../data/profile'
import type { PublicProfile } from '../data/profile'

export function usePublicProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setError('No user ID provided')
      return
    }
    let stale = false
    setLoading(true)
    setError(null)
    readPublicProfile(userId)
      .then((p) => {
        if (stale) return
        setProfile(p)
        setLoading(false)
      })
      .catch(() => {
        if (stale) return
        setError('Failed to load profile')
        setLoading(false)
      })
    return () => {
      stale = true
    }
  }, [userId])

  return { profile, loading, error }
}
