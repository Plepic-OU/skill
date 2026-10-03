import { Link, useParams } from 'react-router'
import { decodeShareCode } from '../data/share'
import Header from '../components/Header'
import SkillTreeLayout from '../components/SkillTreeLayout'
import styles from './ProfilePage.module.css'

export default function SharedResultPage() {
  const { code } = useParams<{ code: string }>()
  const state = decodeShareCode(code ?? '')

  if (!state) {
    return (
      <>
        <Header mode="visitor" />
        <div className={styles.visitorMessage}>
          <h2>Result not found</h2>
          <p>This link is incomplete or was changed on the way.</p>
          <Link to="/" className={styles.ctaLink}>
            Assess your own skills
          </Link>
        </div>
      </>
    )
  }

  return <SkillTreeLayout headerMode="visitor" state={state} readOnly shared />
}
