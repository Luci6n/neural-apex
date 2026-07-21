import { describe, expect, it } from 'vitest'
import { advanceRace, applyCollisionOutcome, brakingRateFor, cancelPitStop, createRace, createRunRecord, createWeatherForecast, evaluateSystemAdvice, predictIncidentRisk, predictLapSeconds, recordPitSpeed, recordTrackLimitViolation, requestPitStop, resolveDecision, tyreStrategyWindowProgress } from '../../../src/simulation/engine'
import type { RaceConfig } from '../../../src/simulation/types'

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
  driverStyle: 'balanced',
  botPreset: 'balanced',
  weatherSeed: 217,
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
    for (let step = 0; step < 1000; step += 1) {
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
    for (let step = 0; step < 320 && !race.racers[0].inPit; step += 1) advanceRace(race, config, 'balanced', 0.05)
    expect(race.racers[0].inPit).toBe(true)
    expect(race.activeTyre).toBe('c3')
    for (let step = 0; step < 180 && race.activeTyre === 'c3'; step += 1) advanceRace(race, config, 'balanced', 0.05)
    expect(race.activeTyre).toBe('intermediate')
    expect(race.eventLog.some((event) => event.startsWith('Box, box:'))).toBe(true)
    expect(race.eventLog.some((event) => event.startsWith('Pit service complete:'))).toBe(true)
  })

  it('records comparable setup and outcome data after a run', () => {
    const race = createRace(config)
    for (let step = 0; step < 2400 && !race.finished; step += 1) {
      advanceRace(race, config, 'balanced', 0.05)
      if (race.needsDecision) resolveDecision(race, 'pit-wet')
    }
    const record = createRunRecord(race, config, 1)
    expect(race.finished).toBe(true)
    expect(record.config.tyre).toBe('c3')
    expect(record.totalSeconds).toBeGreaterThan(0)
    expect(record.bestLapSeconds).not.toBeNull()
  })

  it('clamps experiments to 32 laps and evolves visible weather conditions', () => {
    const race = createRace({ ...config, laps: 99 })
    expect(race.totalLaps).toBe(32)
    const initialTrackTemp = race.trackTemp
    const initialHumidity = race.humidity
    race.rainPeak = .8
    race.rainWillArrive = true
    race.racers[0].progress = race.rainOnsetProgress + 0.5
    race.playerProgress = race.rainOnsetProgress + 0.5
    advanceRace(race, config, 'balanced', 0.05)
    expect(race.rain).toBeGreaterThan(0)
    expect(race.humidity).toBeGreaterThan(initialHumidity)
    expect(race.trackTemp).toBeLessThan(initialTrackTemp)
  })

  it('opens numbered windows only for meaningful evidence and can escalate after staying out', () => {
    const race = createRace({ ...config, laps: 8 })
    race.forecastRainProbability = 90
    race.rainWillArrive = true
    race.rainOnsetProgress = 0.2
    race.rainPeak = 0.8
    race.decisionPoint = 0.4
    race.racers[0].progress = 0.4
    race.playerProgress = 0.4
    advanceRace(race, config, 'balanced', 0.016)
    expect(race.needsDecision).toBe(true)
    expect(race.strategyWindowCount).toBe(1)
    resolveDecision(race, 'stay-out')
    race.racers[0].progress = race.decisionPoint
    race.playerProgress = race.decisionPoint
    advanceRace(race, config, 'balanced', 0.016)
    expect(race.needsDecision).toBe(true)
    expect(race.strategyWindowCount).toBe(2)
  })

  it('opens one baseline review in a multi-lap dry run without forcing a pit vote', () => {
    const race = createRace({ ...config, laps: 3 })
    race.forecastRainProbability = 42
    race.rainWillArrive = false
    race.rainPeak = 0
    race.racers[0].progress = race.decisionPoint
    race.playerProgress = race.decisionPoint
    advanceRace(race, config, 'balanced', 0.016)
    expect(race.needsDecision).toBe(true)
    expect(race.strategyWindowCount).toBe(1)
    expect(evaluateSystemAdvice(race, config).alignment).toBe('agree-stay')
  })

  it('schedules soft, medium, and hard baseline windows at progressively later race fractions', () => {
    expect(tyreStrategyWindowProgress(8, 'c5')).toBeCloseTo(2, 5)
    expect(tyreStrategyWindowProgress(8, 'c3')).toBeCloseTo(4, 5)
    expect(tyreStrategyWindowProgress(8, 'c1')).toBeCloseTo(6, 5)
  })

  it('offers a dry-tyre recovery stop when wet tyres are mismatched to a dry track', () => {
    const wetConfig = { ...config, tyre: 'full-wet' as const }
    const race = createRace(wetConfig)
    race.forecastRainProbability = 42
    race.rainWillArrive = false
    race.rain = 0
    race.racers[0].progress = race.decisionPoint
    race.playerProgress = race.decisionPoint
    advanceRace(race, wetConfig, 'balanced', 0.016)
    expect(race.needsDecision).toBe(true)
    resolveDecision(race, 'pit-dry')
    expect(race.pendingTyre).toBe('c3')
  })

  it('repeats a seeded forecast exactly and varies a new scenario seed', () => {
    expect(createWeatherForecast(config)).toEqual(createWeatherForecast(config))
    expect(createWeatherForecast({ ...config, weatherSeed: 218 })).not.toEqual(createWeatherForecast(config))
  })

  it('uses setup choices in calculated pace and incident risk', () => {
    expect(predictLapSeconds({ ...config, tyre: 'c5', fuel: 'light', runType: 'qualifying' }))
      .toBeLessThan(predictLapSeconds({ ...config, tyre: 'c1', fuel: 'safe', runType: 'test' }))
    expect(predictIncidentRisk({ ...config, priority: 'winning', aero: 'speed', botPreset: 'competitive' }))
      .toBeGreaterThan(predictIncidentRisk({ ...config, priority: 'tyres', aero: 'grip', botPreset: 'rookie', scannerFocus: 'telemetry' }))
  })

  it('makes aggressive style faster but riskier than cautious style', () => {
    const aggressive = { ...config, driverStyle: 'aggressive' as const }
    const cautious = { ...config, driverStyle: 'cautious' as const }
    expect(predictLapSeconds(aggressive)).toBeLessThan(predictLapSeconds(cautious))
    expect(predictIncidentRisk(aggressive)).toBeGreaterThan(predictIncidentRisk(cautious))
  })

  it('uses decisive but style-sensitive braking for a sharp corner', () => {
    expect(brakingRateFor('balanced', 1)).toBeCloseTo(0.44, 5)
    expect(brakingRateFor('aggressive', 1)).toBeLessThan(brakingRateFor('balanced', 1))
    expect(brakingRateFor('cautious', 1)).toBeGreaterThan(brakingRateFor('balanced', 1))
  })

  it('allows the three systems to agree or disagree from the same evidence model', () => {
    const highRisk = createRace({ ...config, scannerFocus: 'telemetry', priority: 'finish' })
    highRisk.forecastRainProbability = 90
    expect(evaluateSystemAdvice(highRisk, { ...config, scannerFocus: 'telemetry', priority: 'finish' }).alignment).toBe('agree-pit')
    const lowRisk = createRace({ ...config, scannerFocus: 'vision', priority: 'winning', pitPolicy: 'track-position' })
    lowRisk.forecastRainProbability = 42
    expect(evaluateSystemAdvice(lowRisk, { ...config, scannerFocus: 'vision', priority: 'winning', pitPolicy: 'track-position' }).alignment).toBe('agree-stay')
    highRisk.rain = 0
    expect(evaluateSystemAdvice(highRisk, { ...config, scannerFocus: 'vision', priority: 'finish' }).alignment).toBe('conflict')
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

  it('queues and cancels a manual box call before pit entry', () => {
    const race = createRace(config)
    requestPitStop(race, 'c4')
    expect(race.pitRequested).toBe(true)
    expect(race.pendingTyre).toBe('c4')
    expect(race.racers[0].inPit).toBe(false)
    cancelPitStop(race)
    expect(race.pitRequested).toBe(false)
    expect(race.pendingTyre).toBeNull()
  })

  it('makes an attack setup visibly faster than a conservative dry-start wet setup', () => {
    const attackConfig: RaceConfig = {
      ...config,
      laps: 32,
      tyre: 'c5',
      fuel: 'light',
      aero: 'speed',
      priority: 'winning',
      driverStyle: 'aggressive',
      runType: 'qualifying',
    }
    const conservativeConfig: RaceConfig = {
      ...config,
      laps: 32,
      tyre: 'full-wet',
      fuel: 'safe',
      aero: 'grip',
      priority: 'tyres',
      driverStyle: 'cautious',
      runType: 'test',
    }
    const attack = createRace(attackConfig)
    const conservative = createRace(conservativeConfig)
    attack.decisionPoint = 99
    conservative.decisionPoint = 99
    attack.rainWillArrive = false
    conservative.rainWillArrive = false
    let attackPeak = 0
    let conservativePeak = 0
    for (let step = 0; step < 400; step += 1) {
      advanceRace(attack, attackConfig, 'push', 0.05)
      advanceRace(conservative, conservativeConfig, 'conserve', 0.05)
      attackPeak = Math.max(attackPeak, attack.speedKph)
      conservativePeak = Math.max(conservativePeak, conservative.speedKph)
    }
    expect(attackPeak).toBeGreaterThan(300)
    expect(attackPeak).toBeGreaterThan(conservativePeak + 25)
    expect(attack.playerProgress).toBeGreaterThan(conservative.playerProgress)
  })

  it('finishes timed sessions at zero while races remain lap-based', () => {
    for (const runType of ['test', 'qualifying'] as const) {
      const timedConfig = { ...config, runType }
      const timed = createRace(timedConfig)
      timed.decisionPoint = timed.totalLaps + 1
      timed.elapsed = timed.sessionDuration - 0.01
      advanceRace(timed, timedConfig, 'balanced', 0.05)
      expect(timed.finished).toBe(true)
      expect(timed.eventLog.at(-1)).toContain('complete')
    }

    const race = createRace(config)
    race.decisionPoint = race.totalLaps + 1
    race.elapsed = race.sessionDuration + 1
    advanceRace(race, config, 'balanced', 0.05)
    expect(race.finished).toBe(false)
  })
})
