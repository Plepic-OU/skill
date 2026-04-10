import { showToast } from './Toast'
import styles from './ShareButton.module.css'

export function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 10l4-4M10.5 3.5a2.12 2.12 0 113 3L11 9a2.12 2.12 0 01-3 0M5 7a2.12 2.12 0 010 3l-2.5 2.5a2.12 2.12 0 01-3-3L5 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ShareButton() {
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied!', 'success')
    } catch {
      showToast("Couldn't copy link.", 'error')
    }
  }

  return (
    <button className={styles.shareBtn} onClick={handleShare} aria-label="Copy profile link">
      <LinkIcon />
      Share
    </button>
  )
}
