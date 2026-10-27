import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { expandedCard, firstNodeHeader, nodeHeader } from '../helpers/claim'

const { When, Then } = createBdd()

When('I focus the first skill node', async ({ page }) => {
  await firstNodeHeader(page).focus()
})

When('I focus the {string} node', async ({ page }, name: string) => {
  await nodeHeader(page, name).focus()
})

When('I press {word}', async ({ page }, key: string) => {
  await page.keyboard.press(key)
})

Then('the node detail should be visible', async ({ page }) => {
  const expanded = page.locator('[aria-expanded="true"]')
  await expect(expanded).toHaveCount(1)
})

Then('the {string} action should have focus', async ({ page }, text: string) => {
  await expect(
    expandedCard(page).getByRole('button', { name: new RegExp(`^${text}`) }),
  ).toBeFocused()
})

Then('the {string} node header should have focus', async ({ page }, name: string) => {
  await expect(nodeHeader(page, name)).toBeFocused()
})
