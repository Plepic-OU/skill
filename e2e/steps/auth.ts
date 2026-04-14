import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { createTestUser, TEST_EMAIL, TEST_PASSWORD } from '../helpers/emulator'

const { Given, When, Then } = createBdd()

When('I click the login button', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign in to save' }).click()
})

Given('I sign in as a test user', async ({ page }) => {
  // Create user in emulator
  await createTestUser(TEST_EMAIL, TEST_PASSWORD)

  // Sign in via the window-exposed Firebase SDK (dev mode only)
  await page.evaluate(
    async ({ email, password }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      await w.__e2e_signInWithEmailAndPassword(w.__e2e_auth, email, password)
    },
    { email: TEST_EMAIL, password: TEST_PASSWORD },
  )

  // Wait for header to reflect auth state
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({ timeout: 5000 })
})

When('I sign out', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign out' }).first().click()
  // Confirm in the custom sign-out dialog
  await page.getByRole('button', { name: 'Sign out' }).last().click()
  await expect(page.getByText('Sign in to save')).toBeVisible({ timeout: 5000 })
})

Then('I should see the sign-in modal with Google option', async ({ page }) => {
  await expect(page.getByText('Sign in with Google')).toBeVisible()
})

Then('I should see the user avatar in the header', async ({ page }) => {
  // Avatar fallback (letter) should be visible since emulator users have no photo
  await expect(page.getByTestId('user-avatar')).toBeVisible()
})

Then('I should see a {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeVisible()
})

Then('I should not see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).not.toBeVisible()
})

Then('I should not see the user avatar', async ({ page }) => {
  await expect(page.getByTestId('user-avatar')).not.toBeVisible()
})
