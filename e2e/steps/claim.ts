import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { When, Then } = createBdd()

When('I expand the {string} node', async ({ page }, name: string) => {
  const node = page.getByLabel(new RegExp(name)).first()
  const expanded = await node.getAttribute('aria-expanded')
  if (expanded !== 'true') {
    await node.click()
    await expect(node).toHaveAttribute('aria-expanded', 'true')
  }
})

When('I click {string}', async ({ page }, buttonText: string) => {
  // Find the button inside the currently expanded node to avoid clicking hidden buttons
  const expandedNode = page.locator('[aria-expanded="true"]').first()
  const label = (await expandedNode.getAttribute('aria-label')) ?? ''
  const nodeName = label.replace(/^Level \d+: /, '').replace(/ — .*$/, '')
  const btn = expandedNode.getByRole('button', { name: buttonText })
  await expect(btn).toBeVisible()
  await btn.click()
  // Wait for the aria-label to reflect the state change (claim → "reached", unclaim → "up next")
  const expectedState = buttonText === 'This is me' ? 'reached' : 'up next'
  await expect(
    page.locator(`[aria-label*="${nodeName}"][aria-label*="${expectedState}"]`).first(),
  ).toBeVisible({ timeout: 10000 })
})

Then('the {string} node should be claimed', async ({ page }, name: string) => {
  const node = page.locator(`[aria-label*="${name}"][aria-label*="reached"]`).first()
  await expect(node).toBeVisible({ timeout: 5000 })
})

Then('the {string} node should not be claimed', async ({ page }, name: string) => {
  const node = page.locator(`[aria-label*="${name}"][aria-label*="reached"]`)
  await expect(node).toHaveCount(0)
})

Then('the Autonomy progress chip should show {string}', async ({ page }, value: string) => {
  const chip = page.locator('[aria-live="polite"]').getByText(/Autonomy/)
  await expect(chip).toContainText(value)
})
