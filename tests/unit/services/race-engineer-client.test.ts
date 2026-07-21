import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRace, defaultConfig } from '../../../src/simulation'
import { requestConflictExplanation, requestDebrief } from '../../../src/services/race-engineer/client'

function streamResponse(events: unknown[], status = 200): Response {
  return new Response(events.map((event) => JSON.stringify(event)).join('\n') + '\n', {
    status,
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
}

describe('race-engineer client', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends complete race context and emits streamed explanation deltas', async () => {
    const race = createRace(defaultConfig)
    race.adviceAlignment = 'conflict'
    const data = {
      explanation: 'Compare the forecast with live grip.', source: 'openai', alignment: 'conflict',
      predictor: { recommendation: 'pit', evidence: 'Rain forecast.', confidence: 'medium' },
      scanner: { recommendation: 'stay-out', evidence: 'Track dry.', confidence: 'high' },
      adaptiveDriver: { recommendation: 'stay-out', evidence: 'Protect position.', confidence: 'medium' },
      engineerSummary: 'Different time horizons.', tradeoff: 'You make the call.',
    }
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([
      { type: 'status', message: 'analysing' },
      { type: 'delta', delta: 'Compare ' },
      { type: 'delta', delta: 'the evidence.' },
      { type: 'complete', data },
    ]))
    vi.stubGlobal('fetch', fetchMock)
    const deltas: string[] = []

    await expect(requestConflictExplanation(race, defaultConfig, null, (delta) => deltas.push(delta))).resolves.toEqual(data)
    expect(deltas.join('')).toBe('Compare the evidence.')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const payload = JSON.parse(String(init.body))
    expect(url).toBe('/api/explain/stream')
    expect(payload.race.setup).toEqual(defaultConfig)
    expect(payload.race.racers).toHaveLength(5)
    expect(payload.race.computedAdvice.alignment).toBe('conflict')
    expect(payload.race.forecastRainOnsetLap).toBeGreaterThan(0)
  })

  it('posts final race context to the debrief stream', async () => {
    const race = createRace(defaultConfig)
    const data = { debrief: 'One clear lesson.', source: 'openai' }
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([
      { type: 'delta', delta: 'One clear lesson.' },
      { type: 'complete', data },
    ]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestDebrief(race, defaultConfig)).resolves.toEqual(data)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const payload = JSON.parse(String(init.body))
    expect(url).toBe('/api/debrief/stream')
    expect(payload.race.setup.weatherSeed).toBe(defaultConfig.weatherSeed)
    expect(payload.race.computedAdvice).toBeTruthy()
  })

  it('rejects unsuccessful or incomplete streams explicitly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse([], 503)))
    await expect(requestDebrief(createRace(defaultConfig), defaultConfig)).rejects.toThrow('Post-race coach request failed')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse([{ type: 'delta', delta: 'partial' }])))
    await expect(requestDebrief(createRace(defaultConfig), defaultConfig)).rejects.toThrow('before completion')
  })
})
