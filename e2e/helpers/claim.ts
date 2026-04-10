import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export async function claimLevel(page: Page, name: string) {
  await page.waitForSelector('#questMap')
  const node = page.getByLabel(new RegExp(name)).first()
  await node.click()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  const expandedNode = page.locator('[aria-expanded="true"]').first()
  const btn = expandedNode.getByRole('button', { name: 'This is me' })
  await expect(btn).toBeVisible()
  await btn.click()
  await expect(page.locator(`[aria-label*="${name}"][aria-label*="reached"]`).first()).toBeVisible({
    timeout: 10000,
  })
}
