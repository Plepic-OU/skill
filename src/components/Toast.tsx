import { useEffect, useCallback, useRef, useState } from 'react'
import styles from './Toast.module.css'

/** Delay before the CSS fadeOut animation starts (must match Toast.module.css). */
const FADE_OUT_DELAY_MS = 3200

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
}

// Singleton: exactly one <Toast /> must be mounted for showToast() to work.
// StrictMode-safe: re-mounts overwrite (last mount wins) instead of throwing.
let nextId = 0
let addToastFn: ((text: string, type: 'success' | 'error') => void) | null = null

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  addToastFn?.(text, type)
}

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const removingRef = useRef<Set<number>>(new Set())
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const setter = (text: string, type: 'success' | 'error') => {
      const id = nextId++
      setMessages((prev) => [...prev, { id, text, type }])

      // Mark the toast as "removing" once the fadeOut animation starts.
      // This avoids relying on CSS Modules' mangled animation names.
      const timer = setTimeout(() => {
        removingRef.current.add(id)
        timersRef.current.delete(id)
      }, FADE_OUT_DELAY_MS)
      timersRef.current.set(id, timer)
    }

    // Allow re-registration for StrictMode double-mount (last mount wins)
    addToastFn = setter

    const timers = timersRef.current
    return () => {
      // Only clear if this instance's setter is still the active one
      if (addToastFn === setter) {
        addToastFn = null
      }
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const handleAnimationEnd = useCallback((id: number) => {
    if (removingRef.current.has(id)) {
      removingRef.current.delete(id)
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
          data-type={msg.type}
          onAnimationEnd={() => handleAnimationEnd(msg.id)}
        >
          {msg.text}
        </div>
      ))}
    </div>
  )
}
