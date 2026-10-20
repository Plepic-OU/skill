import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import {
  claimLevel,
  claimedNodeLocator,
  expandedCard,
  nodeCard,
  nodeHeader,
} from '../helpers/claim'

const { Given, When, Then } = createBdd()

Given('I claim the {string} level', async ({ page }, name: string) => {
  await claimLevel(page, name)
})

When('I expand the {string} node', async ({ page }, name: string) => {
  const header = nodeHeader(page, name)
  const expanded = await header.getAttribute('aria-expanded')
  if (expanded !== 'true') {
    await header.click()
    await expect(header).toHaveAttribute('aria-expanded', 'true')
  }
})

When('I click the {string} action', async ({ page }, buttonText: string) => {
  // Find the button inside the currently expanded card to avoid clicking hidden buttons
  const card = expandedCard(page)
  const nodeName = await card.getAttribute('data-skill-name')
  if (!nodeName) throw new Error('No expanded card with a data-skill-name attribute')
  const btn = card.getByRole('button', { name: new RegExp(`^${buttonText}`) })
  await expect(btn).toBeVisible()
  await btn.click()
  // Wait for the header label to reflect the state change (claim -> "reached", unclaim -> "up next")
  const expectedState = buttonText === 'This is me' ? 'reached' : 'up next'
  await expect(
    nodeCard(page, nodeName).getByRole('button', { name: new RegExp(`— ${expectedState}$`) }),
  ).toBeVisible({ timeout: 10000 })
})

Then('the {string} node should be claimed', async ({ page }, name: string) => {
  await expect(claimedNodeLocator(page, name)).toBeVisible({ timeout: 5000 })
})

Then('the {string} node should not be claimed', async ({ page }, name: string) => {
  // Asserted on the header so the step waits for the card instead of passing
  // vacuously while the tree is still rendering.
  await expect(nodeHeader(page, name)).not.toHaveAccessibleName(/— reached$/)
})

Then('the Autonomy progress chip should show {string}', async ({ page }, value: string) => {
  // Target the breakdown row by stable data-axis, not by text proximity —
  // "Autonomy" and the level value live in sibling spans.
  const chip = page.locator('[data-axis="autonomy"]')
  await expect(chip).toContainText(value)
})
