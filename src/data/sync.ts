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

function hasValidSkills(skills: unknown): skills is SkillLevels {
  return (
    typeof skills === 'object' &&
    skills !== null &&
    typeof (skills as Record<string, unknown>).autonomy === 'number' &&
    typeof (skills as Record<string, unknown>).parallelExecution === 'number' &&
    typeof (skills as Record<string, unknown>).skillUsage === 'number'
  )
}

/**
 * Parse a raw Firestore user document into a typed read shape, or null if the
 * skills payload is missing/malformed. Single source of truth for both
 * syncOnLogin and readPublicProfile.
 */
export function parseFirestoreUser(data: Record<string, unknown>): FirestoreUserRead | null {
  if (!hasValidSkills(data.skills)) return null
  return data as unknown as FirestoreUserRead
}

export function toSkillState(data: FirestoreUserRead): SkillState {
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

  const parsed = snapshot.exists()
    ? parseFirestoreUser(snapshot.data() as Record<string, unknown>)
    : null

  if (parsed) {
    // Update profile info (may have changed since last login)
    await setDoc(
      userRef,
      {
        displayName: user.displayName ?? 'Anonymous',
        avatarUrl: user.photoURL ?? '',
      },
      { merge: true },
    )
    return toSkillState(parsed)
  }

  const local = loadState()
  await writeAssessment(user.uid, local, user)
  return local
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
