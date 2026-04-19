import { showToast } from './Toast'
import styles from './ShareButton.module.css'

interface ShareButtonProps {
  url?: string
}

export default function ShareButton({ url }: ShareButtonProps) {
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(url ?? window.location.href)
      showToast('Link copied!', 'success')
    } catch {
      showToast("Couldn't copy link.", 'error')
    }
  }

  return (
    <button className={styles.shareBtn} onClick={handleShare} aria-label="Copy profile link">
      <span className={`material-symbols-rounded ${styles.shareIcon}`} aria-hidden="true">
        share
      </span>
      Share
    </button>
  )
}
