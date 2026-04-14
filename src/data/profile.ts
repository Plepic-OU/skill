import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { SkillState } from '../types/skill-tree'
import { hasValidSkills, toSkillState, type FirestoreUserRead } from './sync'

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
  const raw = snapshot.data() as Record<string, unknown>
  if (!hasValidSkills(raw)) return null
  const data = raw as unknown as FirestoreUserRead
  return {
    ...toSkillState(data),
    displayName: data.displayName ?? 'Anonymous',
    // Stryker disable next-line StringLiteral: any truthy fallback still fails isHttpUrl when avatarUrl is undefined
    avatarUrl: isHttpUrl(data.avatarUrl ?? '') ? (data.avatarUrl as string) : '',
  }
}
