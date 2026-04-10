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

/** Locate a skill node that has been claimed (reached) by its data-skill-name attribute. */
export function claimedNodeLocator(page: Page, name: string) {
  return page.locator(`[data-skill-name="${name}"][aria-label*="reached"]`).first()
}

export async function claimLevel(page: Page, name: string) {
  await waitForQuestMap(page)
  const node = page.getByLabel(new RegExp(name)).first()
  await node.click()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  const btn = node.getByRole('button', { name: 'This is me' })
  await expect(btn).toBeVisible()
  await btn.click()
  await expect(claimedNodeLocator(page, name)).toBeVisible({
    timeout: 10000,
  })
}
