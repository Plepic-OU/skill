import { showToast } from './Toast'
import { trackShare, type ShareMethod } from '../analytics'
import styles from './ShareButton.module.css'

export async function copyLink(url: string, method: ShareMethod): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
    trackShare(method)
    showToast('Link copied!', 'success')
  } catch {
    showToast("Couldn't copy link.", 'error')
  }
}

interface ShareButtonProps {
  url?: string
}

export default function ShareButton({ url }: ShareButtonProps) {
  return (
    <button
      className={styles.shareBtn}
      onClick={() => copyLink(url ?? window.location.href, 'profile_link')}
      aria-label="Copy profile link"
    >
      <span className={`material-symbols-rounded ${styles.shareIcon}`} aria-hidden="true">
        share
      </span>
      Share
    </button>
  )
}
