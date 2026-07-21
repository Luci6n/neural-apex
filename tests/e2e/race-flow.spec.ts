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
  await page.getByRole('button', { name: 'How to play', exact: true }).click()
  await expect(page).toHaveURL(/\/tutorial$/)
  await page.getByRole('button', { name: /Back/i }).click()
  await expect(page).toHaveURL(/\/setup$/)
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
  const modal = page.getByRole('dialog', { name: /The systems (agree|disagree)/i })
  await expect(modal).toBeVisible()
  await expect(page.getByText(/Race engineer · GPT-5.6/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /Box, box · Intermediates/i }).click()
  await expect(page.getByTestId('active-tyre')).toContainText('C4 ACTIVE')
  await expect(page.getByTestId('active-tyre')).toContainText('I AT SERVICE BAY')
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('pit-entry'))
  await expect.poll(() => page.evaluate(() => Boolean((window.__THREE_GAME_DIAGNOSTICS__ as { player?: { inPit?: boolean } })?.player?.inPit))).toBe(true)
  await expect(page.getByTestId('pit-timing')).toBeVisible()
  await expect(page.getByText(/SECONDS STATIONARY/i)).toBeVisible()
  await expect(page.getByTestId('active-tyre')).toContainText('I ACTIVE', { timeout: 5_000 })
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
  await expect.poll(() => page.evaluate(() => Boolean(window.__THREE_GAME_TEST_HOOKS__))).toBe(true)
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('decision'))
  await expect(modal).toBeVisible()
  await expect(page.getByText(/Race engineer · GPT-5.6/i)).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /Stay out/i }).click()
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('finish'))

  await expect(page.getByText(/PREVIOUS #1/i)).toBeVisible()
  await expect(page.getByText(/THIS RUN #2/i)).toBeVisible()
  expect(errors).toEqual([])
})

test('keeps the live AI rail and strategy window readable without overlap or horizontal overflow', async ({ page }) => {
  await page.route('**/api/explain/stream', async (route) => {
    const data = {
      alignment: 'conflict',
      predictor: { recommendation: 'pit', evidence: 'Forecast rain is increasing.', confidence: 'medium' },
      scanner: { recommendation: 'stay-out', evidence: 'The surface remains dry.', confidence: 'high' },
      adaptiveDriver: { recommendation: 'stay-out', evidence: 'Track position remains valuable.', confidence: 'medium' },
      engineerSummary: 'The systems use different evidence.',
      tradeoff: 'The final call belongs to the team principal.',
      explanation: 'The systems use different evidence. The final call belongs to the team principal.',
      source: 'openai',
    }
    await route.fulfill({
      contentType: 'application/x-ndjson',
      body: JSON.stringify({ type: 'status', message: 'analysing' }) + '\n'
        + JSON.stringify({ type: 'delta', delta: data.explanation }) + '\n'
        + JSON.stringify({ type: 'complete', data }) + '\n',
    })
  })
  await page.goto('/?qaHooks=1')
  await page.getByRole('button', { name: /Launch autonomous race/i }).click()
  await expect(page.locator('.race-signal-rail')).toBeVisible()
  const rail = await page.locator('.race-signal-rail').boundingBox()
  const telemetry = await page.locator('.telemetry-stack').boundingBox()
  expect(rail && telemetry && rail.y + rail.height <= telemetry.y).toBe(true)

  await page.setViewportSize({ width: 790, height: 760 })
  await expect.poll(() => page.evaluate(() => Boolean(window.__THREE_GAME_TEST_HOOKS__))).toBe(true)
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState?.('decision'))
  const modal = page.locator('.decision-modal')
  await expect(modal).toBeVisible()
  const overflow = await modal.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }))
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1)
})

async function readProgress(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__ as
      | { progress?: number }
      | undefined
    return diagnostics?.progress ?? 0
  })
}
