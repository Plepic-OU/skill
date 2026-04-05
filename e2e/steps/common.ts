import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

Given('I open the skill tree page', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('#questMap')
})

// --- Browse ---

Then('I should see the {string} path', async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
})

When('I click on the {string} node', async ({ page }, name: string) => {
  await page.getByLabel(new RegExp(name)).first().click()
})

When('I click on the {string} node again', async ({ page }, name: string) => {
  await page.getByLabel(new RegExp(name)).first().click()
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

// --- Claim/Unclaim ---

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
  const btn = expandedNode.getByRole('button', { name: buttonText })
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true })
  // Wait for React re-render after state change
  await page.waitForTimeout(200)
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

// --- Safety Zone ---

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
  await expect(page.getByText(/Mistake stops client services/)).toBeVisible()
})

// --- Persistence ---

When('I reload the page', async ({ page }) => {
  await page.reload()
  await page.waitForSelector('#questMap')
})

// --- Keyboard ---

When('I focus the first skill node', async ({ page }) => {
  const firstNode = page.locator('[role="button"][aria-expanded]').first()
  await firstNode.focus()
})

When('I press Enter', async ({ page }) => {
  await page.keyboard.press('Enter')
})

Then('the node detail should be visible', async ({ page }) => {
  const expanded = page.locator('[aria-expanded="true"]')
  await expect(expanded).toHaveCount(1)
})
