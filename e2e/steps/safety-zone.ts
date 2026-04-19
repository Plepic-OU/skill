import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { When, Then } = createBdd()

When('I click the {string} safety zone button', async ({ page }, label: string) => {
  await page.getByRole('radio', { name: label }).click()
})

Then('the {string} button should be active', async ({ page }, label: string) => {
  const btn = page.getByRole('radio', { name: label })
  await expect(btn).toHaveAttribute('aria-checked', 'true')
})

Then('the {string} button should not be active', async ({ page }, label: string) => {
  const btn = page.getByRole('radio', { name: label })
  await expect(btn).toHaveAttribute('aria-checked', 'false')
})

Then('I should see the hardcore zone description', async ({ page }) => {
  await expect(page.getByText(/Business-critical systems/)).toBeVisible()
})
