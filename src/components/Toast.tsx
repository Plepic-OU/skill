import { useEffect, useCallback, useState } from 'react'
import styles from './Toast.module.css'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
}

// Singleton: exactly one <Toast /> must be mounted for showToast() to work.
// Calls before mount or with multiple instances will silently no-op / duplicate.
let nextId = 0
let addToastFn: ((text: string, type: 'success' | 'error') => void) | null = null

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  addToastFn?.(text, type)
}

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (text, type) => {
      const id = nextId++
      setMessages((prev) => [...prev, { id, text, type }])
    }
    return () => {
      addToastFn = null
    }
  }, [])

  const handleAnimationEnd = useCallback((id: number, e: React.AnimationEvent) => {
    if (e.animationName.includes('fadeOut')) {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    }
  }, [])

  if (messages.length === 0) return null

  return (
    <div className={styles.container} aria-live="polite">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`${styles.toast} ${styles[msg.type]}`}
          onAnimationEnd={(e) => handleAnimationEnd(msg.id, e)}
        >
          {msg.text}
        </div>
      ))}
    </div>
  )
}
