import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import type { SkillState } from '../types/skill-tree'
import { loadState } from './state'

interface FirestoreUserWrite {
  updatedAt: FieldValue
  safetyZone: SkillState['safetyZone']
  skills: {
    autonomy: number
    parallelExecution: number
    skillUsage: number
  }
  displayName?: string
  avatarUrl?: string
}

interface FirestoreUserRead {
  updatedAt: Timestamp
  displayName?: string
  avatarUrl?: string
  safetyZone: SkillState['safetyZone']
  skills: {
    autonomy: number
    parallelExecution: number
    skillUsage: number
  }
}

// Stryker disable BlockStatement: catch returns false but undefined (falsy) has same effect in callers
function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
// Stryker restore BlockStatement

export interface PublicProfile extends SkillState {
  displayName: string
  avatarUrl: string
}

export async function readPublicProfile(userId: string): Promise<PublicProfile | null> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return null
  const data = snapshot.data() as FirestoreUserRead
  return {
    autonomy: data.skills.autonomy,
    parallelExecution: data.skills.parallelExecution,
    skillUsage: data.skills.skillUsage,
    safetyZone: data.safetyZone,
    displayName: data.displayName ?? 'Anonymous',
    // Stryker disable next-line StringLiteral: any truthy fallback still fails isHttpUrl when avatarUrl is undefined
    avatarUrl: isHttpUrl(data.avatarUrl ?? '') ? (data.avatarUrl as string) : '',
  }
}

export async function syncOnLogin(user: User): Promise<SkillState> {
  // Stryker disable next-line StringLiteral: collection name tested via doc mock path assertion
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    const data = snapshot.data() as FirestoreUserRead
    // Update profile info (may have changed since last login)
    await setDoc(
      userRef,
      {
        displayName: user.displayName ?? 'Anonymous',
        avatarUrl: user.photoURL ?? '',
      },
      { merge: true },
    )
    return {
      autonomy: data.skills.autonomy,
      parallelExecution: data.skills.parallelExecution,
      skillUsage: data.skills.skillUsage,
      safetyZone: data.safetyZone,
    }
  } else {
    const local = loadState()
    await writeAssessment(user.uid, local, user)
    return local
  }
}

export async function writeAssessment(
  userId: string,
  state: SkillState,
  user?: User,
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const data: FirestoreUserWrite = {
    updatedAt: serverTimestamp(),
    safetyZone: state.safetyZone,
    skills: {
      autonomy: state.autonomy,
      parallelExecution: state.parallelExecution,
      skillUsage: state.skillUsage,
    },
    ...(user
      ? {
          displayName: user.displayName ?? 'Anonymous',
          avatarUrl: user.photoURL ?? '',
        }
      : {}),
  }
  await setDoc(userRef, data, { merge: true })
}
