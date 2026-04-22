import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useDialog } from '../hooks/useDialog'
import { signInWithGoogle } from '../data/auth'
import { auth } from '../firebase'
import demoAccountsData from '../../preview/demo-accounts.json'
import styles from './SignInModal.module.css'

// Shown in preview (VITE_EMULATOR_HOST) and local vite dev (import.meta.env.DEV);
// stripped from production builds.
const DEMO_ACCOUNTS =
  import.meta.env.VITE_EMULATOR_HOST || import.meta.env.DEV ? demoAccountsData : []

interface SignInModalProps {
  open: boolean
  onClose: () => void
}

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const dialogRef = useDialog(open, onClose)
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  async function handleProvider(signIn: () => Promise<unknown>) {
    setError(null)
    setIsSigningIn(true)
    try {
      await signIn()
      onClose()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') {
        // User closed popup — not an error
      } else if (code === 'auth/popup-blocked') {
        setError('Popup blocked \u2014 please allow popups for this site.')
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Try signing in with Google instead.')
      } else {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.content}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.subtitle}>
          Save your progress across devices. We only store your skill levels and display name.
        </p>
        <div className={styles.buttons}>
          <button
            className={styles.providerBtn}
            onClick={() => handleProvider(signInWithGoogle)}
            disabled={isSigningIn}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isSigningIn ? 'Signing in\u2026' : 'Sign in with Google'}
          </button>
        </div>
        {DEMO_ACCOUNTS.length > 0 && (
          <div className={styles.demoSection}>
            <p className={styles.demoLabel}>Demo accounts</p>
            <div className={styles.buttons}>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  className={styles.providerBtn}
                  onClick={() =>
                    handleProvider(() =>
                      signInWithEmailAndPassword(auth, account.email, account.password),
                    )
                  }
                  disabled={isSigningIn}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </dialog>
  )
}
