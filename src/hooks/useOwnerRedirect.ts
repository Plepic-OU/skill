import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import type { User } from 'firebase/auth'

/**
 * Redirects to `/` when the authenticated owner signs out.
 * Also calls `onOwnerSignOut` (e.g. to reset state) before navigating.
 */
export function useOwnerRedirect(
  user: User | null,
  loading: boolean,
  userId: string | undefined,
  onOwnerSignOut: () => void,
) {
  const navigate = useNavigate()
  const ownerSessionActive = useRef(false)
  const isOwner = user?.uid === userId

  useEffect(() => {
    if (isOwner) {
      ownerSessionActive.current = true
    } else if (ownerSessionActive.current && !loading) {
      ownerSessionActive.current = false
      onOwnerSignOut()
      navigate('/', { replace: true })
    }
  }, [isOwner, loading, navigate, onOwnerSignOut])
}
