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
    setLoading(true)
    setError(null)
    readPublicProfile(userId)
      .then((p) => {
        setProfile(p)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load profile')
        setLoading(false)
      })
  }, [userId])

  return { profile, loading, error }
}
