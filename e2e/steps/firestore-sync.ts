import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import {
  createTestUser,
  setFirestoreAssessment,
  getFirestoreUser,
  TEST_EMAIL,
  TEST_PASSWORD,
} from '../helpers/emulator'

const { Given, Then } = createBdd()

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- playwright-bdd requires destructured fixtures
Given('the test user has autonomy level {int} in Firestore', async ({ page }, level: number) => {
  const result = await createTestUser(TEST_EMAIL, TEST_PASSWORD)
  const userId = result.localId

  await setFirestoreAssessment(
    userId,
    { autonomy: level, parallelExecution: 1, skillUsage: 1 },
    'sandbox',
  )
})

Then(
  'the Firestore assessment should have autonomy level {int}',
  async ({ page }, level: number) => {
    const uid = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__e2e_auth?.currentUser?.uid as string | undefined
    })
    expect(uid).toBeTruthy()

    // Poll Firestore until the write completes (avoids fixed-delay flakiness)
    const userId = uid as string
    await expect(async () => {
      const doc = await getFirestoreUser(userId)
      const autonomyField = doc.fields?.skills?.mapValue?.fields?.autonomy
      const autonomy = autonomyField?.integerValue ?? autonomyField?.doubleValue
      expect(Number(autonomy)).toBe(level)
    }).toPass({ timeout: 10000, intervals: [500, 1000, 2000] })
  },
)
