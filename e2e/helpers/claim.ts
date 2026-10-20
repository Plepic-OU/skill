import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Wait for the quest map region to be visible using a semantic selector. */
export function questMap(page: Page) {
  return page.getByRole('region', { name: 'Skill tree paths' })
}

/** Wait for the quest map to be visible before interacting with it. */
export async function waitForQuestMap(page: Page) {
  await expect(questMap(page)).toBeVisible({ timeout: 10000 })
}

/** A skill card, by its data-skill-name attribute. */
export function nodeCard(page: Page, name: string) {
  return page.locator(`[data-skill-name="${name}"]`).first()
}

/** A card's header button: it carries aria-expanded and the "Level N: name — state" label. */
export function nodeHeader(page: Page, name: string) {
  return nodeCard(page, name).getByRole('button', { name: /^Level \d+:/ })
}

/** The first card's header button, whichever level it is. */
export function firstNodeHeader(page: Page) {
  return page
    .locator('[data-skill-name]')
    .first()
    .getByRole('button', { name: /^Level \d+:/ })
}

/** The card whose header button is expanded. */
export function expandedCard(page: Page) {
  return page
    .locator('[data-skill-name]')
    .filter({ has: page.getByRole('button', { expanded: true }) })
    .first()
}

/** Locate a skill node that has been claimed. Anchored: "not yet reached" must not match. */
export function claimedNodeLocator(page: Page, name: string) {
  return nodeCard(page, name).getByRole('button', { name: /— reached$/ })
}

export async function claimLevel(page: Page, name: string) {
  await waitForQuestMap(page)
  const header = nodeHeader(page, name)
  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  const btn = nodeCard(page, name).getByRole('button', { name: /^This is me/ })
  await expect(btn).toBeVisible()
  await btn.click()
  await expect(claimedNodeLocator(page, name)).toBeVisible({
    timeout: 10000,
  })
}
