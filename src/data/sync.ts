import { doc, getDoc, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import type { SkillLevels, SkillState } from '../types/skill-tree'
import { loadState } from './state'

interface FirestoreUserWrite {
  updatedAt: FieldValue
  safetyZone: SkillState['safetyZone']
  skills: SkillLevels
  displayName?: string
  avatarUrl?: string
}

export interface FirestoreUserRead {
  displayName?: string
  avatarUrl?: string
  safetyZone: SkillState['safetyZone']
  skills: SkillLevels
}

export function hasValidSkills(data: Record<string, unknown>): boolean {
  const skills = data.skills
  return (
    typeof skills === 'object' &&
    skills !== null &&
    typeof (skills as Record<string, unknown>).autonomy === 'number' &&
    typeof (skills as Record<string, unknown>).parallelExecution === 'number' &&
    typeof (skills as Record<string, unknown>).skillUsage === 'number'
  )
}

export function toSkillState(data: {
  skills: SkillLevels
  safetyZone: SkillState['safetyZone']
}): SkillState {
  return {
    autonomy: data.skills.autonomy,
    parallelExecution: data.skills.parallelExecution,
    skillUsage: data.skills.skillUsage,
    safetyZone: data.safetyZone,
  }
}

function toFirestoreSkills(state: SkillState): SkillLevels {
  return {
    autonomy: state.autonomy,
    parallelExecution: state.parallelExecution,
    skillUsage: state.skillUsage,
  }
}

export async function syncOnLogin(user: User): Promise<SkillState> {
  // Stryker disable next-line StringLiteral: collection name tested via doc mock path assertion
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  const raw = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null
  if (raw && hasValidSkills(raw)) {
    const data = raw as unknown as FirestoreUserRead
    // Update profile info (may have changed since last login)
    await setDoc(
      userRef,
      {
        displayName: user.displayName ?? 'Anonymous',
        avatarUrl: user.photoURL ?? '',
      },
      { merge: true },
    )
    return toSkillState(data)
  } else {
    const local = loadState()
    await writeAssessment(user.uid, local, user)
    return local
  }
}

export async function writeAssessment(
  userId: string,
  state: SkillState,
  profile?: User,
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const data: FirestoreUserWrite = {
    updatedAt: serverTimestamp(),
    safetyZone: state.safetyZone,
    skills: toFirestoreSkills(state),
    ...(profile
      ? {
          displayName: profile.displayName ?? 'Anonymous',
          avatarUrl: profile.photoURL ?? '',
        }
      : {}),
  }
  await setDoc(userRef, data, { merge: true })
}
