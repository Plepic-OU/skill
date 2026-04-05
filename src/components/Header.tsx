import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../data/auth'
import SignInModal from './SignInModal'
import styles from './Header.module.css'

export default function Header() {
  const { user, loading } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>P</div>
        Agentic Skills
      </div>
      <div className={styles.authArea}>
        {loading ? null : user ? (
          <div className={styles.userInfo}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {user.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className={styles.displayName} title={user.displayName ?? undefined}>
              {user.displayName ?? 'Anonymous'}
            </span>
            <button className={styles.btnSignOut} onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <button className={styles.btnLogin} onClick={() => setModalOpen(true)}>
              Log in to save
            </button>
            <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
          </>
        )}
      </div>
    </header>
  )
}
