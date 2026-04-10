import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import type { User } from 'firebase/auth'

/**
 * Redirects to `/` when the authenticated owner signs out.
 * Also calls `onLogout` (e.g. to reset state) before navigating.
 */
export function useOwnerRedirect(
  user: User | null,
  loading: boolean,
  userId: string | undefined,
  onLogout: () => void,
) {
  const navigate = useNavigate()
  const ownerSessionActive = useRef(false)
  const isOwner = user?.uid === userId

  useEffect(() => {
    if (isOwner) {
      ownerSessionActive.current = true
    } else if (ownerSessionActive.current && !loading) {
      ownerSessionActive.current = false
      onLogout()
      navigate('/', { replace: true })
    }
  }, [isOwner, loading, navigate, onLogout])
}
