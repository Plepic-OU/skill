export const TEST_EMAIL = 'test@example.com'
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test-only emulator credential
export const TEST_PASSWORD = 'testpassword123'
export const TEST_DISPLAY_NAME = 'Test User'

const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'
const PROJECT_ID = 'skill-plepic-com'

export async function createTestUser(email: string, password: string) {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    // User already exists — sign in instead to get their localId
    if (res.status === 400 && body.includes('EMAIL_EXISTS')) {
      const signInRes = await fetch(
        `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        },
      )
      if (!signInRes.ok) {
        const signInBody = await signInRes.text()
        throw new Error(
          `createTestUser signIn fallback failed (${signInRes.status}): ${signInBody}`,
        )
      }
      return signInRes.json()
    }
    throw new Error(`createTestUser failed (${res.status}): ${body}`)
  }
  return res.json()
}

export async function clearEmulatorData() {
  await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  })
  await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
}

export async function setFirestoreAssessment(
  userId: string,
  skills: { autonomy: number; parallelExecution: number; skillUsage: number },
  safetyZone: string,
) {
  const res = await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          displayName: { stringValue: TEST_DISPLAY_NAME },
          avatarUrl: { stringValue: '' },
          updatedAt: { timestampValue: new Date().toISOString() },
          safetyZone: { stringValue: safetyZone },
          skills: {
            mapValue: {
              fields: {
                autonomy: { integerValue: String(skills.autonomy) },
                parallelExecution: { integerValue: String(skills.parallelExecution) },
                skillUsage: { integerValue: String(skills.skillUsage) },
              },
            },
          },
        },
      }),
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`setFirestoreAssessment failed (${res.status}): ${body}`)
  }
}

export async function getFirestoreUser(userId: string) {
  const res = await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`,
    {
      headers: { Authorization: 'Bearer owner' },
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getFirestoreUser failed (${res.status}): ${body}`)
  }
  return res.json()
}
