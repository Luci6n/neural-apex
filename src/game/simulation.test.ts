import { describe, expect, it } from 'vitest'
import { advanceRace, applyCollisionOutcome, createRace, createRunRecord, recordPitSpeed, recordTrackLimitViolation, resolveDecision } from './simulation'
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
    expect(race.pitRequested).toBe(true)
    expect(race.racers[0].inPit).toBe(false)
    expect(race.activeTyre).toBe('c3')
    expect(race.playerProgress).toBe(before)
    for (let step = 0; step < 120 && !race.racers[0].inPit; step += 1) advanceRace(race, config, 'balanced', 0.05)
    expect(race.racers[0].inPit).toBe(true)
    expect(race.activeTyre).toBe('intermediate')
    expect(race.eventLog.some((event) => event.startsWith('Pit entry:'))).toBe(true)
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

  it('applies minor damage and retires a car after a deterministic major accident', () => {
    const race = createRace(config)
    const player = race.racers[0]
    const rival = race.racers[1]
    applyCollisionOutcome(race, player, rival, 'minor')
    expect(player.damage).toBe('minor')
    expect(player.retired).toBe(false)
    applyCollisionOutcome(race, player, rival, 'major')
    expect(player.damage).toBe('major')
    expect(player.retired).toBe(true)
    expect(rival.damage).toBe('minor')
  })

  it('adds five seconds after three track limits and includes it in the saved result', () => {
    const race = createRace(config)
    race.elapsed = 42
    recordTrackLimitViolation(race)
    recordTrackLimitViolation(race)
    expect(race.penaltySeconds).toBe(0)
    recordTrackLimitViolation(race)
    expect(race.penaltySeconds).toBe(5)
    expect(createRunRecord(race, config, 1).totalSeconds).toBe(47)
  })

  it('penalises pit-lane speeds above 80 km/h but accepts the limiter threshold', () => {
    const legal = createRace(config)
    recordPitSpeed(legal, 80)
    expect(legal.penaltySeconds).toBe(0)
    const speeding = createRace(config)
    recordPitSpeed(speeding, 81)
    expect(speeding.penaltySeconds).toBe(5)
    expect(speeding.penalties[0]).toContain('Pit-lane speeding')
  })
})
