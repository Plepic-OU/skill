import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { claimLevel, claimedNodeLocator } from '../helpers/claim'

const { Given, When, Then } = createBdd()

Given('I claim the {string} level', async ({ page }, name: string) => {
  await claimLevel(page, name)
})

When('I expand the {string} node', async ({ page }, name: string) => {
  const node = page.getByLabel(new RegExp(name)).first()
  const expanded = await node.getAttribute('aria-expanded')
  if (expanded !== 'true') {
    await node.click()
    await expect(node).toHaveAttribute('aria-expanded', 'true')
  }
})

When('I click the {string} action', async ({ page }, buttonText: string) => {
  // Find the button inside the currently expanded node to avoid clicking hidden buttons
  const expandedNode = page.locator('[aria-expanded="true"]').first()
  const nodeName = await expandedNode.getAttribute('data-skill-name')
  if (!nodeName) throw new Error('Expanded node has no data-skill-name attribute')
  const btn = expandedNode.getByRole('button', { name: buttonText })
  await expect(btn).toBeVisible()
  await btn.click()
  // Wait for the aria-label to reflect the state change (claim -> "reached", unclaim -> "up next")
  const expectedState = buttonText === 'This is me' ? 'reached' : 'up next'
  await expect(
    page.locator(`[data-skill-name="${nodeName}"][aria-label*="${expectedState}"]`).first(),
  ).toBeVisible({ timeout: 10000 })
})

Then('the {string} node should be claimed', async ({ page }, name: string) => {
  await expect(claimedNodeLocator(page, name)).toBeVisible({ timeout: 5000 })
})

Then('the {string} node should not be claimed', async ({ page }, name: string) => {
  const node = page.locator(`[data-skill-name="${name}"][aria-label*="reached"]`)
  await expect(node).toHaveCount(0)
})

Then('the Autonomy progress chip should show {string}', async ({ page }, value: string) => {
  // Target the breakdown row by stable data-axis, not by text proximity —
  // "Autonomy" and the level value live in sibling spans.
  const chip = page.locator('[data-axis="autonomy"]')
  await expect(chip).toContainText(value)
})
