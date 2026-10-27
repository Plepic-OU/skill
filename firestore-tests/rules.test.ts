import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'

const profile = {
  displayName: 'Alice',
  avatarUrl: '',
  safetyZone: 'normal',
  skills: { autonomy: 3, parallelExecution: 2, skillUsage: 4 },
}

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/alice'), profile))
})

const visitor = () => env.unauthenticatedContext().firestore()
const alice = () => env.authenticatedContext('alice').firestore()
const bob = () => env.authenticatedContext('bob').firestore()

describe('users', () => {
  it('lets anyone open one profile by its id', async () => {
    await assertSucceeds(getDoc(doc(visitor(), 'users/alice')))
  })

  it('denies listing profiles', async () => {
    await assertFails(getDocs(collection(visitor(), 'users')))
    await assertFails(getDocs(collection(bob(), 'users')))
  })

  it('lets the owner save a valid profile', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), profile))
  })

  it("denies writing another user's profile", async () => {
    await assertFails(setDoc(doc(bob(), 'users/alice'), profile))
  })

  it('denies unknown keys', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), { ...profile, email: 'alice@example.com' }))
  })

  it('denies a level above 6', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users/alice'), { ...profile, skills: { ...profile.skills, autonomy: 7 } }),
    )
  })

  it('denies an unknown stakes value', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), { ...profile, safetyZone: 'chill' }))
  })

  it('denies deleting a profile', async () => {
    await assertFails(deleteDoc(doc(alice(), 'users/alice')))
  })
})
