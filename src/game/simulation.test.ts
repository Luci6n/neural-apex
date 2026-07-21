import { describe, expect, it } from 'vitest'
import { advanceRace, createRace, createRunRecord, resolveDecision } from './simulation'
import type { RaceConfig } from './types'

const config: RaceConfig = {
  mode: 'guided',
  circuit: 'ardennes',
  runType: 'race',
  laps: 3,
  difficulty: 'professional',
  tyre: 'c3',
  fuel: 'balanced',
  aero: 'balanced',
  pitPolicy: 'forecast',
  scannerFocus: 'balanced',
  priority: 'finish',
  botPreset: 'balanced',
}

describe('autonomous race simulation', () => {
  it('moves and steers the player car without manual input', () => {
    const race = createRace(config)
    for (let step = 0; step < 100; step += 1) {
      advanceRace(race, config, 'balanced', 0.05)
    }
    expect(race.playerProgress).toBeGreaterThan(0)
    expect(Math.abs(race.racers[0].lane)).toBeGreaterThan(0)
    expect(race.fuelRemaining).toBeLessThan(90)
    expect(race.tyreWear).toBeGreaterThan(0)
  })

  it('pauses at the conflict and applies the team pit decision', () => {
    const race = createRace(config)
    for (let step = 0; step < 300; step += 1) {
      advanceRace(race, config, 'push', 0.05)
      if (race.needsDecision) break
    }
    expect(race.needsDecision).toBe(true)
    const before = race.playerProgress
    resolveDecision(race, 'pit-intermediate')
    expect(race.activeTyre).toBe('intermediate')
    expect(race.racers[0].inPit).toBe(true)
    expect(race.playerProgress).toBeLessThan(before)
  })

  it('records comparable setup and outcome data after a run', () => {
    const race = createRace(config)
    for (let step = 0; step < 1000 && !race.finished; step += 1) {
      advanceRace(race, config, 'balanced', 0.05)
      if (race.needsDecision) resolveDecision(race, 'pit-wet')
    }
    const record = createRunRecord(race, config, 1)
    expect(race.finished).toBe(true)
    expect(record.config.tyre).toBe('c3')
    expect(record.totalSeconds).toBeGreaterThan(0)
    expect(record.bestLapSeconds).not.toBeNull()
  })

  it('clamps experiments to eight laps and evolves visible weather conditions', () => {
    const race = createRace({ ...config, laps: 99 })
    expect(race.totalLaps).toBe(8)
    race.racers[0].progress = 0.9
    race.playerProgress = 0.9
    advanceRace(race, config, 'balanced', 0.05)
    expect(race.rain).toBeGreaterThan(0)
    expect(race.humidity).toBeGreaterThan(config.circuit === 'ardennes' ? 72 : 0)
    expect(race.trackTemp).toBeLessThan(29)
  })
})
