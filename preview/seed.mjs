#!/usr/bin/env node
/*
 * Preview-env seeder.
 *
 * Runs once per container cold-start. Creates the demo users with DETERMINISTIC
 * UIDs so profile URLs like /profile/demo-alice stay stable across deploys.
 *
 * Why firebase-admin instead of the previous curl+signUp approach: the Auth
 * emulator's REST /accounts:signUp rejects a custom `localId`, which meant
 * every cold-start minted a fresh random UID and broke every shared preview
 * link. The Admin SDK uses a separate internal endpoint that DOES honor
 * custom UIDs — problem solved.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:9199'

const PROJECT_ID = 'skill-plepic-com'
// Script-relative so this works both inside the container (/app/preview) and
// when a dev runs it from the repo against local emulators.
const ACCOUNTS_FILE = join(dirname(fileURLToPath(import.meta.url)), 'demo-accounts.json')

initializeApp({ projectId: PROJECT_ID })
const auth = getAuth()
const db = getFirestore()

const accounts = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))

async function ensureUser({ uid, email, password, displayName }) {
  try {
    await auth.getUser(uid)
    return
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
  }
  await auth.createUser({ uid, email, password, displayName })
  console.log(`  Created user: ${email} (${uid})`)
}

for (const a of accounts) {
  await ensureUser(a)
}

// Alice gets a populated assessment so the visitor view has something to show;
// Bob stays empty so owner-flow testing starts from zero.
const alice = accounts.find((a) => a.displayName === 'Alice')
await db.doc(`users/${alice.uid}`).set({
  displayName: alice.displayName,
  avatarUrl: '',
  updatedAt: new Date(),
  safetyZone: 'normal',
  skills: { autonomy: 4, parallelExecution: 3, skillUsage: 5 },
})
console.log(`  Seeded Firestore for: ${alice.displayName} (${alice.uid})`)
console.log('Demo data seeding complete.')
