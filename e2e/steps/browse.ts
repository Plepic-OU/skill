import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { expandedCard, nodeHeader } from '../helpers/claim'

const { When, Then } = createBdd()

Then('I should see the {string} path', async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
})

When('I click on the {string} node', async ({ page }, name: string) => {
  await nodeHeader(page, name).click()
})

When('I click on the {string} node again', async ({ page }, name: string) => {
  const node = nodeHeader(page, name)
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  await node.click()
})

Then('I should see the node detail with {string}', async ({ page }, text: string) => {
  // Scoped to the open card: collapsed details are clipped, not hidden, so a
  // page-wide text match would pass without anything being expanded.
  await expect(expandedCard(page).getByText(text).first()).toBeVisible()
})

Then('the node detail should be hidden', async ({ page }) => {
  const expanded = page.locator('[aria-expanded="true"]')
  await expect(expanded).toHaveCount(0)
})

Then('the {string} node detail should be hidden', async ({ page }, name: string) => {
  const node = nodeHeader(page, name)
  await expect(node).toHaveAttribute('aria-expanded', 'false')
})

Then('the {string} node detail should be visible', async ({ page }, name: string) => {
  const node = nodeHeader(page, name)
  await expect(node).toHaveAttribute('aria-expanded', 'true')
})
