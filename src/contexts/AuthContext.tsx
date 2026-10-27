import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import { resetState } from '../data/state'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const wasSignedIn = useRef(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      // Only a sign-out clears levels; progress made without an account stays.
      if (!firebaseUser && wasSignedIn.current) resetState()
      wasSignedIn.current = firebaseUser !== null
      setUser(firebaseUser)
      setLoading(false)
    })
  }, [])

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>
}

export function useAuth() {
  return useContext(AuthContext)
}
