import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { When, Then } = createBdd()

Then('I should see the {string} path', async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
})

When('I click on the {string} node', async ({ page }, name: string) => {
  await page.getByLabel(new RegExp(name)).first().click()
})

When('I click on the {string} node again', async ({ page }, name: string) => {
  const node = page.getByLabel(new RegExp(name)).first()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  await node.click()
})

Then('I should see the node detail with {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text).first()).toBeVisible()
})

Then('the node detail should be hidden', async ({ page }) => {
  const expanded = page.locator('[aria-expanded="true"]')
  await expect(expanded).toHaveCount(0)
})

Then('the {string} node detail should be hidden', async ({ page }, name: string) => {
  const node = page.getByLabel(new RegExp(name)).first()
  await expect(node).toHaveAttribute('aria-expanded', 'false')
})

Then('the {string} node detail should be visible', async ({ page }, name: string) => {
  const node = page.getByLabel(new RegExp(name)).first()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
})
