import { Link, useLocation } from 'react-router'
import styles from './PlepicLogo.module.css'

const MOBILE_MAX_WIDTH = 560

function scrollToTopSmooth() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function PlepicLogo() {
  const location = useLocation()

  const handleClick = (e: React.MouseEvent) => {
    // Mobile: logo taps scroll to the top of the current page instead of navigating,
    // since mobile browsers lack a scroll-thumb affordance. Desktop keeps Link nav.
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_WIDTH) {
      e.preventDefault()
      scrollToTopSmooth()
      return
    }
    // On desktop, if we're already on the home route, also scroll up rather than no-op.
    if (location.pathname === '/') {
      e.preventDefault()
      scrollToTopSmooth()
    }
  }

  return (
    <Link to="/" className={styles.logoLockup} aria-label="Plepic Skill home" onClick={handleClick}>
      <svg
        className={styles.logoButterfly}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 280"
        width="28"
        height="26"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <polygon points="147,105 110,68 55,48" fill="#0d5822" stroke="#0d5822" strokeWidth="0.5" />
        <polygon points="147,105 55,48 20,72" fill="#00c638" stroke="#00c638" strokeWidth="0.5" />
        <polygon points="147,105 20,72 15,108" fill="#137b30" stroke="#137b30" strokeWidth="0.5" />
        <polygon
          points="147,130 147,105 15,108"
          fill="#00c638"
          stroke="#00c638"
          strokeWidth="0.5"
        />
        <polygon points="147,130 15,108 28,150" fill="#0d5822" stroke="#0d5822" strokeWidth="0.5" />
        <polygon
          points="147,165 147,130 28,150"
          fill="#00c638"
          stroke="#00c638"
          strokeWidth="0.5"
        />
        <polygon points="147,165 28,150 50,178" fill="#137b30" stroke="#137b30" strokeWidth="0.5" />
        <polygon points="147,178 50,178 82,195" fill="#0d5822" stroke="#0d5822" strokeWidth="0.5" />
        <polygon points="147,178 82,195 75,220" fill="#00c638" stroke="#00c638" strokeWidth="0.5" />
        <polygon
          points="147,195 75,220 100,240"
          fill="#137b30"
          stroke="#137b30"
          strokeWidth="0.5"
        />
        <polygon
          points="147,195 100,240 135,232"
          fill="#0d5822"
          stroke="#0d5822"
          strokeWidth="0.5"
        />
        <polygon points="153,105 190,68 245,48" fill="#0d5822" stroke="#0d5822" strokeWidth="0.5" />
        <polygon points="153,105 245,48 280,72" fill="#00c638" stroke="#00c638" strokeWidth="0.5" />
        <polygon
          points="153,105 280,72 285,108"
          fill="#137b30"
          stroke="#137b30"
          strokeWidth="0.5"
        />
        <polygon
          points="153,130 153,105 285,108"
          fill="#00c638"
          stroke="#00c638"
          strokeWidth="0.5"
        />
        <polygon
          points="153,130 285,108 272,150"
          fill="#0d5822"
          stroke="#0d5822"
          strokeWidth="0.5"
        />
        <polygon
          points="153,165 153,130 272,150"
          fill="#00c638"
          stroke="#00c638"
          strokeWidth="0.5"
        />
        <polygon
          points="153,165 272,150 250,178"
          fill="#0d5822"
          stroke="#0d5822"
          strokeWidth="0.5"
        />
        <polygon
          points="153,178 250,178 218,195"
          fill="#137b30"
          stroke="#137b30"
          strokeWidth="0.5"
        />
        <polygon
          points="153,178 218,195 225,220"
          fill="#00c638"
          stroke="#00c638"
          strokeWidth="0.5"
        />
        <polygon
          points="153,195 225,220 200,240"
          fill="#137b30"
          stroke="#137b30"
          strokeWidth="0.5"
        />
        <polygon
          points="153,195 200,240 165,232"
          fill="#0d5822"
          stroke="#0d5822"
          strokeWidth="0.5"
        />
        <path d="M150,92 C158,120 158,150 150,200 C142,150 142,120 150,92Z" fill="#0d5822" />
        <path
          d="M150,86 C146,72 140,55 136,42"
          fill="none"
          stroke="#0d5822"
          strokeWidth="1.8"
          opacity="0.7"
        />
        <path
          d="M150,86 C154,72 160,55 164,42"
          fill="none"
          stroke="#0d5822"
          strokeWidth="1.8"
          opacity="0.7"
        />
        <circle cx="136" cy="41" r="3.5" fill="#00c638" />
        <circle cx="164" cy="41" r="3.5" fill="#00c638" />
        <circle cx="150" cy="90" r="8" fill="#e26c45" stroke="#e26c45" strokeWidth="0.8" />
      </svg>
      <span className={styles.logoWordmark}>Plepic</span>
      <span className={styles.logoSuffix} aria-hidden="true">
        Skill
      </span>
    </Link>
  )
}
