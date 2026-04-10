import { createBdd } from 'playwright-bdd'

const { When } = createBdd()

When('I reload the page', async ({ page }) => {
  await page.reload()
  await page.waitForSelector('#questMap')
})
