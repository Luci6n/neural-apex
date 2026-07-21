import { evaluateSystemAdvice } from '../game/simulation'
import type { AdviceAlignment, AdviceRecommendation, RaceConfig, RaceDecision, RaceSnapshot } from '../game/types'

export interface SystemVerdictResponse {
  recommendation: AdviceRecommendation
  evidence: string
  confidence: 'low' | 'medium' | 'high'
}

export interface ExplanationResponse {
  explanation: string
  source: string
  alignment: Exclude<AdviceAlignment, 'pending'>
  predictor: SystemVerdictResponse
  scanner: SystemVerdictResponse
  adaptiveDriver: SystemVerdictResponse
  engineerSummary: string
  tradeoff: string
}

interface DebriefResponse {
  debrief: string
  source: string
}

export async function requestConflictExplanation(
  race: RaceSnapshot,
  config: RaceConfig,
  decision: RaceDecision | null,
  onDelta?: (delta: string) => void,
): Promise<ExplanationResponse> {
  const response = await fetch('/api/explain/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'Why do the three AI assistants ' + (race.adviceAlignment === 'conflict' ? 'disagree' : 'agree') + ' about pitting?',
      decision,
      race: {
        ...race,
        setup: config,
        forecastRainOnsetLap: Math.floor(race.rainOnsetProgress) + 1,
        computedAdvice: evaluateSystemAdvice(race, config),
      },
    }),
  })
  if (!response.ok) throw new Error('Race engineer request failed')
  return readNdjson<ExplanationResponse>(response, onDelta)
}

export async function requestDebrief(
  race: RaceSnapshot,
  config: RaceConfig,
  onDelta?: (delta: string) => void,
): Promise<DebriefResponse> {
  const response = await fetch('/api/debrief/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      race: { ...race, setup: config, computedAdvice: evaluateSystemAdvice(race, config) },
    }),
  })
  if (!response.ok) throw new Error('Post-race coach request failed')
  return readNdjson<DebriefResponse>(response, onDelta)
}

async function readNdjson<Result>(response: Response, onDelta?: (delta: string) => void): Promise<Result> {
  if (!response.body) throw new Error('Streaming response is unavailable')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: Result | null = null
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      const event = JSON.parse(line) as { type: string; delta?: string; data?: Result }
      if (event.type === 'delta' && event.delta) onDelta?.(event.delta)
      if (event.type === 'complete' && event.data) result = event.data
    }
    if (done) break
  }
  if (!result) throw new Error('Streaming response ended before completion')
  return result
}
