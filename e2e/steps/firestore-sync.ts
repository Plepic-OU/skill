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

async function claimLevel(page: import('@playwright/test').Page, name: string) {
  const node = page.getByLabel(new RegExp(name)).first()
  await node.click()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  const expandedNode = page.locator('[aria-expanded="true"]').first()
  const btn = expandedNode.getByRole('button', { name: 'This is me' })
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true })
  await page.waitForTimeout(500)
}

Given('I claim the {string} level', async ({ page }, name: string) => {
  await claimLevel(page, name)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('the test user has autonomy level {int} in Firestore', async ({ page }, level: number) => {
  const result = await createTestUser(TEST_EMAIL, TEST_PASSWORD)
  const userId = result.localId

  await setFirestoreAssessment(
    userId,
    { autonomy: level, parallelExecution: 1, skillUsage: 1 },
    'safe-zone',
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

    // Wait for Firestore write to complete
    await page.waitForTimeout(1000)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const doc = await getFirestoreUser(uid!)
    const autonomyField = doc.fields?.skills?.mapValue?.fields?.autonomy
    const autonomy = autonomyField?.integerValue ?? autonomyField?.doubleValue
    expect(Number(autonomy)).toBe(level)
  },
)
