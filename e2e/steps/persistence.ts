import { createBdd } from 'playwright-bdd'
import { waitForQuestMap } from '../helpers/claim'

const { When } = createBdd()

When('I reload the page', async ({ page }) => {
  await page.reload()
  await waitForQuestMap(page)
})
