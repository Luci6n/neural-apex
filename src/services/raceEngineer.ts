import type { RaceConfig, RaceDecision, RaceSnapshot } from '../game/types'

interface ExplanationResponse {
  explanation: string
  source: string
}

interface DebriefResponse {
  debrief: string
  source: string
}

export async function requestConflictExplanation(
  race: RaceSnapshot,
  config: RaceConfig,
  decision: RaceDecision | null,
): Promise<ExplanationResponse> {
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Why do the three AI assistants disagree about pitting?',
      decision,
      race: {
        lap: race.lap,
        position: race.position,
        rain: race.rain,
        airTemp: race.airTemp,
        trackTemp: race.trackTemp,
        humidity: race.humidity,
        windKph: race.windKph,
        tyreWear: race.tyreWear,
        fuelRemaining: race.fuelRemaining,
        activeTyre: race.activeTyre,
        setup: config,
        predictor: 'Rain likely soon, medium confidence',
        scanner: 'Track still dry; rear tyre heat rising; live air, track, humidity, and wind measured',
        adaptiveDriver: 'Stay out to protect track position',
      },
    }),
  })
  if (!response.ok) throw new Error('Race engineer request failed')
  return response.json()
}

export async function requestDebrief(
  race: RaceSnapshot,
  config: RaceConfig,
): Promise<DebriefResponse> {
  const response = await fetch('/api/debrief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      race: {
        position: race.position,
        elapsed: race.elapsed,
        bestLap: race.bestLapSeconds,
        decision: race.decision,
        tyreWear: race.tyreWear,
        fuelRemaining: race.fuelRemaining,
        weather: { rain: race.rain, airTemp: race.airTemp, trackTemp: race.trackTemp, humidity: race.humidity, windKph: race.windKph },
        events: race.eventLog,
        setup: config,
      },
    }),
  })
  if (!response.ok) throw new Error('Post-race coach request failed')
  return response.json()
}
