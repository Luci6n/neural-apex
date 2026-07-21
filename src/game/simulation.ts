import { createBotGrid } from './config'
import { trackProfiles } from './tracks'
import { isWetTyre, tyreProfiles } from './tyres'
import type {
  DebriefData,
  RaceConfig,
  RaceDecision,
  RaceSnapshot,
  RacerState,
  RunRecord,
  StrategyCommand,
  TyreCompound,
} from './types'

const DECISION_POINT = 0.62
const SCANNER_POINT = 0.32
const ADAPT_POINT = 1.12

export function createRace(config: RaceConfig): RaceSnapshot {
  const track = trackProfiles[config.circuit]
  const totalLaps = clamp(Math.round(config.laps), 1, 8)
  const player: RacerState = {
    id: 'player',
    name: 'Neural Apex',
    color: '#ff633f',
    progress: 0,
    lane: 0,
    speed: 0,
    adaptive: true,
    tyre: config.tyre,
    inPit: false,
    finished: false,
    bestLapSeconds: null,
    lastLapStarted: 0,
    pitTimeRemaining: 0,
    collisionCooldown: 0,
    damage: 'none',
    retired: false,
  }
  const predictedLapSeconds = predictLapSeconds(config)
  return {
    elapsed: 0,
    totalLaps,
    sessionDuration: Math.max(30, totalLaps * predictedLapSeconds * 1.22),
    lap: 1,
    lapProgress: 0,
    position: 1,
    playerProgress: 0,
    speedKph: 0,
    rain: 0,
    airTemp: track.weather.airTemp,
    trackTemp: track.weather.trackTemp,
    humidity: track.weather.humidity,
    windKph: track.weather.windKph,
    windDirection: track.weather.windDirection,
    tyreWear: 0,
    fuelRemaining: fuelStart(config),
    grip: isWetTyre(config.tyre) ? 72 : 94,
    activeTyre: config.tyre,
    strategyCommand: 'balanced',
    predictedLapSeconds,
    currentLapSeconds: 0,
    lastLapSeconds: null,
    bestLapSeconds: null,
    scannerAlert: false,
    adaptiveAlert: false,
    needsDecision: false,
    decision: null,
    finished: false,
    racers: [player, ...createBotGrid(config.botPreset)],
    eventLog: [
      'Predictor: expected lap ' + formatSeconds(predictedLapSeconds) + ' · rain chance 68% · confidence medium',
      'Autonomous control: ' + totalLaps + '-lap plan loaded · racing line ready',
    ],
    pitTimeRemaining: 0,
    pitRequested: false,
    pitEntryProgress: null,
    pendingTyre: null,
    incidentRisk: predictIncidentRisk(config),
    trackLimitStrikes: 0,
    trackLimitCooldown: 0,
    penaltySeconds: 0,
    penalties: [],
    pitSpeedKph: null,
    pitSpeedViolationChecked: false,
  }
}

export function advanceRace(
  state: RaceSnapshot,
  config: RaceConfig,
  strategy: StrategyCommand,
  delta: number,
): RaceSnapshot {
  if (state.finished || state.needsDecision) return state
  const dt = Math.min(delta, 0.05)
  const player = state.racers[0]
  state.strategyCommand = strategy
  updateWeather(state, config)

  const setupPace = tyrePace(state.activeTyre, state.rain)
    + fuelPace(config)
    + aeroPace(config)
    + priorityPace(config)
  const strategyPace = strategy === 'push' ? 0.006 : strategy === 'conserve' ? -0.004 : 0
  const wearPenalty = Math.max(0, state.tyreWear - 58) * 0.00012
  const temperaturePenalty = tyreTemperaturePenalty(state.activeTyre, state.trackTemp)
  const windPenalty = config.aero === 'speed' ? state.windKph * 0.000035 : state.windKph * 0.000012
  const pitPenalty = player.inPit ? 0.045 : 0
  const damagePenalty = player.damage === 'minor' ? 0.006 : player.damage === 'major' ? 0.09 : 0
  const playerPace = clamp(
    trackProfiles[config.circuit].pace + setupPace + strategyPace - wearPenalty - temperaturePenalty - windPenalty - pitPenalty - damagePenalty,
    player.inPit ? 0.018 : 0.062,
    0.112,
  )

  player.speed = player.retired ? 0 : playerPace
  if (!player.retired) player.progress += playerPace * dt
  enterScheduledPit(state)
  const lineAmplitude = config.aero === 'grip' ? 0.12 : config.aero === 'speed' ? 0.24 : 0.18
  player.lane = Math.sin(player.progress * Math.PI * 6) * lineAmplitude
  state.elapsed += dt
  state.currentLapSeconds += dt
  state.trackLimitCooldown = Math.max(0, state.trackLimitCooldown - dt)
  tickPitState(player, dt)
  player.collisionCooldown = Math.max(0, player.collisionCooldown - dt)
  state.pitTimeRemaining = player.pitTimeRemaining
  state.tyreWear = clamp(
    state.tyreWear + dt * tyreWearRate(state.activeTyre, strategy, state.rain, state.trackTemp, config.priority),
    0,
    100,
  )
  state.fuelRemaining = clamp(state.fuelRemaining - dt * fuelBurnRate(config, strategy, state.totalLaps), 0, 100)

  state.racers.slice(1).forEach((bot, index) => {
    if (bot.retired) { bot.speed = 0; return }
    const previousLap = Math.floor(Math.max(0, bot.progress))
    const circuitPace = trackProfiles[config.circuit].pace
    const presetPace = config.botPreset === 'rookie' ? circuitPace - 0.009 : config.botPreset === 'competitive' ? circuitPace + 0.003 : circuitPace - 0.003
    const adaptivePush = bot.adaptive && player.progress > ADAPT_POINT ? 0.004 : 0
    if (state.rain > 0.48 && !isWetTyre(bot.tyre) && bot.progress > 0.82 + index * 0.025) {
      bot.tyre = index % 3 === 0 ? 'full-wet' : 'intermediate'
      bot.inPit = true
      bot.pitTimeRemaining = 1.7 + index * 0.08
    }
    const botWeather = tyrePace(bot.tyre, state.rain)
    const botPitPenalty = bot.inPit ? 0.05 : 0
    const botDamage = bot.damage === 'minor' ? 0.005 : bot.damage === 'major' ? 0.09 : 0
    bot.speed = clamp(presetPace + botWeather + adaptivePush + Math.sin(state.elapsed * 0.7 + index) * 0.0007 - botPitPenalty - botDamage, bot.inPit ? 0.016 : 0.058, 0.11)
    bot.progress += bot.speed * dt
    bot.lane += (Math.sin(bot.progress * Math.PI * 4 + index) * 0.25 - bot.lane) * dt
    tickPitState(bot, dt)
    bot.collisionCooldown = Math.max(0, bot.collisionCooldown - dt)
    recordRacerLap(bot, previousLap, state.totalLaps)
  })

  manageTrafficAndIncidents(state, config, strategy)
  applyStewardRules(state, config, strategy)

  if (!state.scannerAlert && player.progress >= SCANNER_POINT) {
    state.scannerAlert = true
    state.eventLog.push('Pattern Scanner: rear tyre heat rising through sector 2')
  }
  if (!state.decision && player.progress >= DECISION_POINT) {
    state.needsDecision = true
    state.eventLog.push('Race engineer: AI systems disagree — change tyres now or protect track position?')
  }
  if (!state.adaptiveAlert && player.progress >= ADAPT_POINT) {
    state.adaptiveAlert = true
    state.eventLog.push('Adaptive Driver: moved braking point after the wet-sector grip loss')
  }

  state.grip = calculateGrip(state.activeTyre, state.rain, state.tyreWear, state.trackTemp, config.aero)
  state.playerProgress = player.progress
  const nextLap = Math.min(state.totalLaps, Math.floor(Math.max(0, player.progress)) + 1)
  if (nextLap > state.lap) {
    state.lastLapSeconds = state.currentLapSeconds
    state.bestLapSeconds = state.bestLapSeconds === null ? state.currentLapSeconds : Math.min(state.bestLapSeconds, state.currentLapSeconds)
    player.bestLapSeconds = state.bestLapSeconds
    player.lastLapStarted = nextLap - 1
    state.currentLapSeconds = 0
  }
  state.lap = nextLap
  state.lapProgress = player.progress % 1
  state.speedKph = Math.round(118 + playerPace * 2140)
  state.incidentRisk = calculateIncidentRisk(state, config, strategy)
  state.position = rankPlayer(state.racers)

  state.racers.forEach((racer) => { racer.finished = racer.retired || racer.progress >= state.totalLaps })
  if (player.retired) {
    state.finished = true
    state.eventLog.push('Major incident: Neural Apex retired · debriefing the risk factors')
  }
  if (player.progress >= state.totalLaps) {
    state.finished = true
    state.lastLapSeconds = state.currentLapSeconds
    state.bestLapSeconds = state.bestLapSeconds === null ? state.currentLapSeconds : Math.min(state.bestLapSeconds, state.currentLapSeconds)
    player.bestLapSeconds = state.bestLapSeconds
    state.eventLog.push('Autonomous run complete: P' + state.position + ' · ' + formatSeconds(state.elapsed))
  }
  return state
}

export function resolveDecision(state: RaceSnapshot, decision: RaceDecision): RaceSnapshot {
  if (!state.needsDecision || state.decision) return state
  state.decision = decision
  state.needsDecision = false
  if (decision !== 'stay-out') {
    const fullWet = decision === 'pit-wet'
    state.pitRequested = true
    state.pendingTyre = fullWet ? 'full-wet' : 'intermediate'
    state.pitEntryProgress = Math.floor(state.racers[0].progress) + 0.86
    state.eventLog.push('Team decision: box for ' + tyreProfiles[state.pendingTyre].name + ' · stop scheduled at pit entry')
  } else {
    state.eventLog.push('Team decision: stay out · track position protected, dry-tyre grip at risk')
  }
  return state
}

export function createDebrief(state: RaceSnapshot): DebriefData {
  const decision = state.decision || 'stay-out'
  const pitted = decision !== 'stay-out'
  const decisionPoints = pitted ? 28 : 17
  return {
    position: state.position,
    score: Math.max(12, 42 - (state.position - 1) * 7) + decisionPoints + 24,
    decision,
    totalSeconds: state.elapsed + state.penaltySeconds,
    predictionOutcome: 'The Predictor expected rain and estimated a ' + formatSeconds(state.predictedLapSeconds) + ' lap from the setup. Rain arrived shortly after the decision window.',
    patternOutcome: 'The Pattern Scanner detected rising rear-tyre heat from live telemetry before the circuit became visibly wet.',
    adaptationOutcome: 'The Adaptive Driver moved its braking point after grip changed, using the earlier outcome to change the next lap.',
    lesson: (pitted
      ? 'Your team trusted the forecast early. The pit stop cost track time, but ' + tyreProfiles[state.activeTyre].name + ' protected grip when the prediction became real.'
      : 'Your team trusted current track evidence. Staying out protected position, but later rain exposed the dry-tyre risk.')
      + (state.penaltySeconds > 0 ? ' Steward penalties added ' + state.penaltySeconds + ' seconds, so clean execution mattered as much as raw pace.' : ''),
  }
}

export function createRunRecord(state: RaceSnapshot, config: RaceConfig, id: number): RunRecord {
  const debrief = createDebrief(state)
  return { id, config: { ...config }, position: state.position, totalSeconds: debrief.totalSeconds, bestLapSeconds: state.bestLapSeconds, tyreWear: state.tyreWear, fuelRemaining: state.fuelRemaining, decision: debrief.decision, score: debrief.score }
}

export function predictLapSeconds(config: RaceConfig): number {
  const track = trackProfiles[config.circuit]
  const tyre = -tyreProfiles[config.tyre].dryPace * 145
  const fuel = config.fuel === 'light' ? -0.6 : config.fuel === 'safe' ? 0.7 : 0
  const aero = config.aero === 'speed' ? -0.35 : config.aero === 'grip' ? 0.3 : 0
  return track.lengthKm * 1.75 + tyre + fuel + aero
}

export function predictIncidentRisk(config: RaceConfig): number {
  const aggression = config.priority === 'winning' ? 6 : config.priority === 'tyres' ? -2 : 0
  const aero = config.aero === 'speed' ? 3 : config.aero === 'grip' ? -2 : 0
  const rivals = config.botPreset === 'competitive' ? 5 : config.botPreset === 'adaptive' ? 3 : config.botPreset === 'rookie' ? -3 : 0
  const tyre = isWetTyre(config.tyre) ? 2 : config.tyre === 'c5' ? 3 : 0
  return Math.round(clamp(9 + aggression + aero + rivals + tyre, 3, 32))
}

export function formatSeconds(value: number | null): string {
  if (value === null) return '—'
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return minutes > 0 ? minutes + ':' + seconds.toFixed(3).padStart(6, '0') : seconds.toFixed(3)
}

export function formatSessionClock(value: number): string {
  const safe = Math.max(0, Math.ceil(value))
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0')
}

function updateWeather(state: RaceSnapshot, config: RaceConfig): void {
  const baseline = trackProfiles[config.circuit].weather
  state.rain = clamp((state.playerProgress - 0.7) * 1.4, 0, 1)
  state.humidity = Math.round(clamp(baseline.humidity + state.rain * 25 + Math.sin(state.elapsed * 0.16) * 2, 35, 99))
  state.airTemp = roundOne(baseline.airTemp - state.rain * 2.6 + Math.sin(state.elapsed * 0.08) * 0.4)
  state.trackTemp = roundOne(baseline.trackTemp - state.rain * 11 - state.elapsed * 0.018)
  state.windKph = Math.round(clamp(baseline.windKph + Math.sin(state.elapsed * 0.35) * 5 + state.rain * 4, 2, 35))
}

function tyrePace(tyre: TyreCompound, rain: number): number {
  const profile = tyreProfiles[tyre]
  return profile.dryPace * (1 - rain) + profile.wetPace * rain
}

function tyreTemperaturePenalty(tyre: TyreCompound, trackTemp: number): number {
  if (isWetTyre(tyre)) return trackTemp > 34 ? (trackTemp - 34) * 0.00013 : 0
  if (trackTemp < 24) return (24 - trackTemp) * 0.0001
  if ((tyre === 'c4' || tyre === 'c5') && trackTemp > 38) return (trackTemp - 38) * 0.0001
  return 0
}

function fuelPace(config: RaceConfig): number { return config.fuel === 'light' ? 0.003 : config.fuel === 'safe' ? -0.002 : 0 }
function aeroPace(config: RaceConfig): number { return config.aero === 'speed' ? 0.002 : config.aero === 'grip' ? -0.001 : 0 }
function priorityPace(config: RaceConfig): number { return config.priority === 'winning' ? 0.002 : config.priority === 'tyres' ? -0.0015 : 0 }

function tyreWearRate(tyre: TyreCompound, strategy: StrategyCommand, rain: number, trackTemp: number, priority: RaceConfig['priority']): number {
  const profile = tyreProfiles[tyre]
  const wrongSurface = isWetTyre(tyre) ? Math.max(0, 0.35 - rain) * 3.8 : rain * 1.8
  const heat = trackTemp > 36 && !isWetTyre(tyre) ? (trackTemp - 36) * 0.06 : 0
  const command = strategy === 'push' ? 0.9 : strategy === 'conserve' ? -0.55 : 0
  const priorityRate = priority === 'tyres' ? -0.25 : priority === 'winning' ? 0.3 : 0
  return Math.max(0.55, profile.wearRate + wrongSurface + heat + command + priorityRate)
}

function fuelBurnRate(config: RaceConfig, strategy: StrategyCommand, laps: number): number {
  const base = config.fuel === 'light' ? 1.7 : config.fuel === 'safe' ? 1.25 : 1.45
  const lapScale = 3 / Math.max(1, laps)
  return (base + (strategy === 'push' ? 0.35 : strategy === 'conserve' ? -0.25 : 0)) * lapScale
}

function fuelStart(config: RaceConfig): number { return config.fuel === 'light' ? 78 : config.fuel === 'safe' ? 100 : 90 }

function calculateGrip(tyre: TyreCompound, rain: number, wear: number, trackTemp: number, aero: RaceConfig['aero']): number {
  const wet = isWetTyre(tyre)
  const weather = wet ? 76 + rain * (tyre === 'full-wet' ? 22 : 18) : 97 - rain * 46
  const temperature = wet && trackTemp > 34 ? -(trackTemp - 34) * 0.7 : !wet && trackTemp < 24 ? -(24 - trackTemp) * 0.8 : 0
  const aeroBonus = aero === 'grip' ? 4 : aero === 'speed' ? -3 : 0
  return Math.round(clamp(weather + temperature + aeroBonus - wear * 0.28, 22, 100))
}

function recordRacerLap(racer: RacerState, previousLap: number, totalLaps: number): void {
  const nextLap = Math.floor(Math.max(0, racer.progress))
  if (nextLap > previousLap && racer.speed > 0) {
    const lapSeconds = 1 / racer.speed
    racer.bestLapSeconds = racer.bestLapSeconds === null ? lapSeconds : Math.min(racer.bestLapSeconds, lapSeconds)
    racer.lastLapStarted = Math.min(nextLap, totalLaps)
  }
}

function tickPitState(racer: RacerState, dt: number): void {
  if (!racer.inPit) return
  racer.pitTimeRemaining = Math.max(0, racer.pitTimeRemaining - dt)
  racer.inPit = racer.pitTimeRemaining > 0
}

function enterScheduledPit(state: RaceSnapshot): void {
  const player = state.racers[0]
  if (!state.pitRequested || state.pitEntryProgress === null || !state.pendingTyre || player.progress < state.pitEntryProgress) return
  const targetTyre = state.pendingTyre
  player.inPit = true
  player.pitTimeRemaining = targetTyre === 'full-wet' ? 2.2 : 1.9
  player.tyre = targetTyre
  state.activeTyre = targetTyre
  state.tyreWear = 0
  state.pitTimeRemaining = player.pitTimeRemaining
  state.pitRequested = false
  state.pitEntryProgress = null
  state.pendingTyre = null
  state.eventLog.push('Pit entry: limiter engaged · fitting ' + tyreProfiles[targetTyre].name)
}

function manageTrafficAndIncidents(state: RaceSnapshot, config: RaceConfig, strategy: StrategyCommand): void {
  for (let first = 0; first < state.racers.length; first += 1) {
    for (let second = first + 1; second < state.racers.length; second += 1) {
      const a = state.racers[first]
      const b = state.racers[second]
      if (a.retired || b.retired) continue
      const progressGap = Math.abs(a.progress - b.progress)
      const laneGap = Math.abs(a.lane - b.lane)
      if (progressGap > 0.032 || laneGap > 0.55) continue

      const trailing = a.progress <= b.progress ? a : b
      const leading = trailing === a ? b : a
      const passSide = deterministicRoll(state.elapsed, trailing.id, leading.id) > 0.5 ? 1 : -1
      trailing.lane = clamp(trailing.lane + passSide * 0.11, -0.8, 0.8)
      leading.lane = clamp(leading.lane - passSide * 0.045, -0.8, 0.8)
      trailing.speed *= 0.94

      if (progressGap > 0.006 || laneGap > 0.13 || a.collisionCooldown > 0 || b.collisionCooldown > 0) continue
      a.collisionCooldown = 0.8
      b.collisionCooldown = 0.8
      const risk = calculateIncidentRisk(state, config, strategy) / 100
      if (deterministicRoll(state.elapsed * 1.7, a.id, b.id) > risk) continue

      const major = deterministicRoll(state.elapsed * 2.3, b.id, a.id) < 0.18 + state.rain * 0.34
      applyCollisionOutcome(state, trailing, leading, major ? 'major' : 'minor', 'risk ' + Math.round(risk * 100) + '% · ' + (state.rain > 0.3 ? 'wet grip' : strategy + ' pace'))
    }
  }
}

function applyStewardRules(state: RaceSnapshot, config: RaceConfig, strategy: StrategyCommand): void {
  const player = state.racers[0]
  const lapFraction = positiveModulo(player.progress, 1)
  const trackLimitWindow = (lapFraction > .34 && lapFraction < .355) || (lapFraction > .78 && lapFraction < .795)
  const limitRisk = .05 + state.rain * .13 + (strategy === 'push' ? .12 : 0) + (config.aero === 'speed' ? .05 : 0) + (config.priority === 'winning' ? .05 : 0)
  if (state.trackLimitCooldown <= 0 && (Math.abs(player.lane) > .68 || (trackLimitWindow && deterministicRoll(state.elapsed * .8, 'limits', player.id) < limitRisk))) {
    recordTrackLimitViolation(state)
    state.trackLimitCooldown = 1.2
  }

  if (player.inPit && !state.pitSpeedViolationChecked) {
    const urgency = strategy === 'push' ? 14 : strategy === 'conserve' ? -5 : 0
    const priority = config.priority === 'winning' ? 8 : 0
    const controlError = Math.floor(deterministicRoll(state.elapsed, 'pit', config.circuit) * 23)
    recordPitSpeed(state, Math.round(61 + urgency + priority + state.rain * 5 + controlError))
  }
}

export function recordTrackLimitViolation(state: RaceSnapshot): void {
  state.trackLimitStrikes += 1
  state.eventLog.push('Stewards: track limits warning ' + state.trackLimitStrikes + '/3')
  if (state.trackLimitStrikes % 3 === 0) addPenalty(state, 5, 'Three track-limit violations')
}

export function recordPitSpeed(state: RaceSnapshot, speedKph: number): void {
  state.pitSpeedKph = Math.round(speedKph)
  state.pitSpeedViolationChecked = true
  if (state.pitSpeedKph > 80) addPenalty(state, 5, 'Pit-lane speeding: ' + state.pitSpeedKph + ' km/h')
  else state.eventLog.push('Pit limiter: ' + state.pitSpeedKph + ' km/h · within 80 km/h limit')
}

export function applyCollisionOutcome(state: RaceSnapshot, trailing: RacerState, leading: RacerState, severity: 'minor' | 'major', context = 'traffic contact'): void {
  trailing.damage = severity
  trailing.retired = severity === 'major'
  if (severity === 'major' && leading.damage === 'none') leading.damage = 'minor'
  state.eventLog.push((severity === 'major' ? 'Major accident' : 'Minor contact') + ': ' + trailing.name + ' and ' + leading.name + ' · ' + context)
}

function addPenalty(state: RaceSnapshot, seconds: number, reason: string): void {
  state.penaltySeconds += seconds
  state.penalties.push('+' + seconds + 's · ' + reason)
  state.eventLog.push('PENALTY +' + seconds + 's: ' + reason)
}

function calculateIncidentRisk(state: RaceSnapshot, config: RaceConfig, strategy: StrategyCommand): number {
  const base = predictIncidentRisk(config)
  const weather = state.rain * 22
  const grip = Math.max(0, 75 - state.grip) * 0.35
  const command = strategy === 'push' ? 8 : strategy === 'conserve' ? -4 : 0
  const wear = Math.max(0, state.tyreWear - 60) * 0.18
  return Math.round(clamp(base + weather + grip + command + wear, 2, 68))
}

function deterministicRoll(time: number, first: string, second: string): number {
  const seed = Math.floor(time * 10) + stringScore(first) * 17 + stringScore(second) * 31
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1
}

function stringScore(value: string): number { return [...value].reduce((total, character) => total + character.charCodeAt(0), 0) }
function positiveModulo(value: number, divisor: number): number { return ((value % divisor) + divisor) % divisor }

function rankPlayer(racers: RacerState[]): number { return [...racers].sort((a, b) => Number(a.retired) - Number(b.retired) || b.progress - a.progress).findIndex((racer) => racer.id === 'player') + 1 }
function roundOne(value: number): number { return Math.round(value * 10) / 10 }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)) }
