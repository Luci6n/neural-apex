import { expect, test } from '@playwright/test'

test('introduces the AI systems, teaches the pit wall, and registers the principal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Three AI systems. One human call/i)).toBeVisible()
  await expect(page.getByText('Predictor', { exact: true })).toBeVisible()
  await expect(page.getByText('Pattern Scanner', { exact: true })).toBeVisible()
  await expect(page.getByText('Adaptive Driver', { exact: true })).toBeVisible()
  await expect(page.locator('.intro-visual canvas')).toBeVisible()

  await page.getByRole('button', { name: /How to play/i }).click()
  await expect(page).toHaveURL(/\/tutorial$/)
  await expect(page.getByRole('heading', { name: /How to run/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Same race. Different evidence/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /What to watch live/i })).toBeVisible()
  await expect(page.getByText(/C4–C5/)).toBeVisible()

  await page.getByRole('button', { name: /Back/i }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.getByLabel('Team principal name').fill('Apex Strategist')
  await page.getByRole('button', { name: /Enter strategy lab/i }).click()
  await expect(page).toHaveURL(/\/setup$/)
  await expect(page.getByText('Apex Strategist')).toBeVisible()
  await expect(page.getByRole('region', { name: /AI crew preflight briefing/i })).toBeVisible()
  await page.getByLabel('Number of laps').fill('8')
  await expect(page.getByText('8 LAPS', { exact: true })).toBeVisible()
})

test('runs two autonomous strategies and compares their GPT debriefs', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/?qaHooks=1')
  await expect(page.getByRole('heading', { name: 'NEURAL APEX' })).toBeVisible()
  await page.getByRole('button', { name: /C4 · Soft$/ }).click()
  await page.getByRole('button', { name: /Launch autonomous race/i }).click()
  await expect(page).toHaveURL(/\/race\?qaHooks=1$/)
  await expect(page.locator('canvas')).toBeVisible()

  const before = await readProgress(page)
  await page.waitForTimeout(700)
  expect(await readProgress(page)).toBeGreaterThan(before)
  await page.getByRole('button', { name: 'Push pace' }).click()

  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('decision'))
  const modal = page.getByRole('dialog', { name: /The systems disagree/i })
  await expect(modal).toBeVisible()
  await page.getByRole('button', { name: /Explain why they disagree/i }).click()
  await expect(page.getByText(/Race engineer · GPT-5.6/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /Box for intermediates/i }).click()
  await expect(page.getByTestId('active-tyre')).toContainText('C4 ACTIVE')
  await expect(page.getByTestId('active-tyre')).toContainText('I AT PIT ENTRY')
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('finish'))

  await expect(page.getByRole('heading', { name: /YOUR PLAN/i })).toBeVisible()
  await expect(page).toHaveURL(/\/result\?qaHooks=1$/)
  await expect(page.getByText(/POST-RACE COACH · GPT-5.6/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Prediction', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pattern', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Adaptation', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Adjust setup & compare/i }).click()
  await expect(page).toHaveURL(/\/setup\?qaHooks=1$/)
  await expect(page.getByText(/LAST RUN · #1/i)).toBeVisible()
  await page.getByRole('button', { name: 'British Apex' }).click()
  await page.getByRole('button', { name: 'Grip', exact: true }).click()
  await page.getByRole('button', { name: /Launch autonomous race/i }).click()
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('decision'))
  await expect(modal).toBeVisible()
  await page.getByRole('button', { name: /Stay out/i }).click()
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('finish'))

  await expect(page.getByText(/PREVIOUS #1/i)).toBeVisible()
  await expect(page.getByText(/THIS RUN #2/i)).toBeVisible()
  expect(errors).toEqual([])
})

async function readProgress(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__ as
      | { progress?: number }
      | undefined
    return diagnostics?.progress ?? 0
  })
}
