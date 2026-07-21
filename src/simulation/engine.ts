import { createBotGrid } from './config'
import { cornerSeverityAt, racingLineOffsetAt, trackProfiles } from './tracks'
import { isWetTyre, tyreProfiles } from './tyres'
import type {
  DebriefData,
  AdviceAlignment,
  AdviceRecommendation,
  RaceConfig,
  RaceDecision,
  RaceSnapshot,
  RacerState,
  RunRecord,
  StrategyCommand,
  TyreCompound,
} from './types'

export interface WeatherForecast {
  seed: number
  airTemp: number
  trackTemp: number
  humidity: number
  windKph: number
  windDirection: string
  rainProbability: number
  rainOnsetProgress: number
  rainPeak: number
  rainWillArrive: boolean
}

export interface SystemAdvice {
  predictor: AdviceRecommendation
  scanner: AdviceRecommendation
  adaptiveDriver: AdviceRecommendation
  alignment: Exclude<AdviceAlignment, 'pending'>
}

export function createRace(config: RaceConfig): RaceSnapshot {
  const track = trackProfiles[config.circuit]
  const forecast = createWeatherForecast(config)
  const totalLaps = clamp(Math.round(config.laps), 1, 32)
  const weatherDecisionPoint = clamp(forecast.rainOnsetProgress - (0.16 + seededUnit(forecast.seed, 'decision-lead') * 0.16), 0.38, totalLaps - 0.12)
  const baselineDecisionPoint = totalLaps >= 3 ? tyreStrategyWindowProgress(totalLaps, config.tyre) : weatherDecisionPoint
  const decisionPoint = Math.min(weatherDecisionPoint, baselineDecisionPoint)
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
    pitStopDuration: 0,
    pitLanePhase: 0,
    pitExitProgress: 0,
    collisionCooldown: 0,
    damage: 'none',
    retired: false,
  }
  const predictedLapSeconds = predictLapSeconds(config)
  return {
    elapsed: 0,
    totalLaps,
    // Prediction uses a compact comparison clock; live laps include visible cornering and traffic.
    sessionDuration: Math.max(45, totalLaps * predictedLapSeconds * 3.2),
    lap: 1,
    lapProgress: 0,
    position: 1,
    playerProgress: 0,
    speedKph: 0,
    rain: 0,
    airTemp: forecast.airTemp,
    trackTemp: forecast.trackTemp,
    humidity: forecast.humidity,
    windKph: forecast.windKph,
    windDirection: forecast.windDirection,
    weatherSeed: forecast.seed,
    baseAirTemp: forecast.airTemp,
    baseTrackTemp: forecast.trackTemp,
    baseHumidity: forecast.humidity,
    baseWindKph: forecast.windKph,
    rainOnsetProgress: forecast.rainOnsetProgress,
    rainPeak: forecast.rainWillArrive ? forecast.rainPeak : 0,
    rainWillArrive: forecast.rainWillArrive,
    decisionPoint,
    strategyWindowCount: 0,
    strategyWindowLimit: strategyWindowLimit(totalLaps),
    lastDecisionProgress: -10,
    forecastRainProbability: forecast.rainProbability,
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
    decisionHistory: [],
    adviceAlignment: 'pending',
    finished: false,
    racers: [player, ...createBotGrid(config.botPreset)],
    eventLog: [
      'Predictor: expected lap ' + formatSeconds(predictedLapSeconds) + ' · rain chance ' + forecast.rainProbability + '% · scenario #' + forecast.seed,
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
    + driverStylePace(config)
    + sessionPace(config)
    + policyPace(config, state)
  const strategyPace = strategy === 'push' ? 0.006 : strategy === 'conserve' ? -0.004 : 0
  const wearPenalty = Math.max(0, state.tyreWear - 58) * 0.00012
  const temperaturePenalty = tyreTemperaturePenalty(state.activeTyre, state.trackTemp)
  const windPenalty = config.aero === 'speed' ? state.windKph * 0.000035 : state.windKph * 0.000012
  const pitPenalty = player.inPit ? 0.045 : 0
  const damagePenalty = player.damage === 'minor' ? 0.006 : player.damage === 'major' ? 0.09 : 0
  const straightPace = clamp(
    trackProfiles[config.circuit].pace + setupPace + strategyPace - wearPenalty - temperaturePenalty - windPenalty - pitPenalty - damagePenalty,
    player.inPit ? 0.018 : 0.062,
    0.112,
  )
  const cornerSeverity = Math.max(
    cornerSeverityAt(config.circuit, player.progress),
    cornerSeverityAt(config.circuit, player.progress + 0.02) * 0.99,
    cornerSeverityAt(config.circuit, player.progress + 0.04) * 0.88,
    cornerSeverityAt(config.circuit, player.progress + 0.065) * 0.72,
  )
  // Keep fast sweepers fast: only material curvature enters the braking curve,
  // while the final third still produces strong hairpin-level deceleration.
  const effectiveCornerSeverity = clamp((cornerSeverity - 0.4) / 0.6, 0, 1) ** 2.05
  const styleCornerLoss = config.driverStyle === 'aggressive' ? 0.62 : config.driverStyle === 'cautious' ? 0.82 : 0.72
  const aeroCornerFactor = config.aero === 'grip' ? 0.86 : config.aero === 'speed' ? 1.1 : 1
  const livePaceScale = player.inPit ? 1 : 1.16
  const targetPace = straightPace * livePaceScale * (1 - effectiveCornerSeverity * styleCornerLoss * aeroCornerFactor)
  const previousPace = player.speed || targetPace * 0.82
  const accelerationResponse = config.driverStyle === 'aggressive' ? 3.2 : config.driverStyle === 'cautious' ? 2.2 : 2.7
  const brakeRate = brakingRateFor(config.driverStyle, effectiveCornerSeverity)
  const playerPace = targetPace < previousPace
    ? Math.max(targetPace, previousPace - brakeRate * dt)
    : previousPace + (targetPace - previousPace) * (1 - Math.exp(-dt * accelerationResponse))
  player.speed = player.retired ? 0 : playerPace
  if (!player.retired) player.progress += playerPace * dt
  enterScheduledPit(state)
  const lineCommitment = (config.driverStyle === 'aggressive' ? 1 : config.driverStyle === 'cautious' ? 0.72 : 0.88)
    * (config.aero === 'speed' ? 1.04 : config.aero === 'grip' ? 0.94 : 1)
  const playerBaseLane = racingLineOffsetAt(config.circuit, player.progress) * lineCommitment
  player.lane += (playerBaseLane - player.lane) * (1 - Math.exp(-dt * 1.55))
  state.elapsed += dt
  state.currentLapSeconds += dt
  state.trackLimitCooldown = Math.max(0, state.trackLimitCooldown - dt)
  tickPitState(player, dt)
  if (player.inPit && player.pitLanePhase !== undefined && player.pitLanePhase >= 0.46 && state.pendingTyre) {
    const fittedTyre = state.pendingTyre
    player.tyre = fittedTyre
    state.activeTyre = fittedTyre
    state.tyreWear = 0
    state.pendingTyre = null
    state.eventLog.push('Pit service complete: ' + tyreProfiles[fittedTyre].name + ' fitted · release when clear')
  }
  player.collisionCooldown = Math.max(0, player.collisionCooldown - dt)
  state.pitTimeRemaining = player.pitTimeRemaining
  state.tyreWear = clamp(
    state.tyreWear + dt * tyreWearRate(state.activeTyre, strategy, state.rain, state.trackTemp, config.priority, config.driverStyle),
    0,
    100,
  )
  state.fuelRemaining = clamp(state.fuelRemaining - dt * fuelBurnRate(config, strategy, state.totalLaps), 0, 100)

  state.racers.slice(1).forEach((bot, index) => {
    if (bot.retired) { bot.speed = 0; return }
    const previousLap = Math.floor(Math.max(0, bot.progress))
    const circuitPace = trackProfiles[config.circuit].pace
    const presetPace = (config.botPreset === 'rookie' ? circuitPace - 0.009 : config.botPreset === 'competitive' ? circuitPace + 0.003 : circuitPace - 0.003) + difficultyPace(config, state)
    const adaptivePush = bot.adaptive && player.progress > state.rainOnsetProgress + 0.28 ? 0.004 : 0
    if (state.rain > 0.48 && !isWetTyre(bot.tyre) && positiveModulo(bot.progress, 1) > 0.92 + index * 0.006) {
      bot.tyre = index % 3 === 0 ? 'full-wet' : 'intermediate'
      bot.inPit = true
      bot.pitTimeRemaining = 4.8 + index * 0.08
      bot.pitStopDuration = bot.pitTimeRemaining
      bot.pitLanePhase = 0
      bot.pitExitProgress = Math.floor(bot.progress) + 1.1
    }
    const botWeather = tyrePace(bot.tyre, state.rain)
    const botPitPenalty = bot.inPit ? 0.05 : 0
    const botDamage = bot.damage === 'minor' ? 0.005 : bot.damage === 'major' ? 0.09 : 0
    const botStraightPace = clamp(presetPace + botWeather + adaptivePush + Math.sin(state.elapsed * 0.7 + index) * 0.0007 - botPitPenalty - botDamage, bot.inPit ? 0.016 : 0.058, 0.11)
    const botCornerSeverity = Math.max(
      cornerSeverityAt(config.circuit, bot.progress),
      cornerSeverityAt(config.circuit, bot.progress + 0.02) * 0.99,
      cornerSeverityAt(config.circuit, bot.progress + 0.04) * 0.88,
      cornerSeverityAt(config.circuit, bot.progress + 0.065) * 0.72,
    )
    const botEffectiveCornerSeverity = clamp((botCornerSeverity - 0.4) / 0.6, 0, 1) ** 2.05
    const botCornerLoss = config.botPreset === 'competitive' ? 0.62 : config.botPreset === 'rookie' ? 0.82 : 0.72
    const botTargetPace = botStraightPace * (bot.inPit ? 1 : 1.16) * (1 - botEffectiveCornerSeverity * botCornerLoss)
    const botPreviousPace = bot.speed || botTargetPace * 0.82
    const botBrakeRate = brakingRateFor('balanced', botEffectiveCornerSeverity)
    bot.speed = botTargetPace < botPreviousPace
      ? Math.max(botTargetPace, botPreviousPace - botBrakeRate * dt)
      : botPreviousPace + (botTargetPace - botPreviousPace) * (1 - Math.exp(-dt * 2.7))
    bot.progress += bot.speed * dt
    const botLineCommitment = config.botPreset === 'competitive' ? 0.94 : config.botPreset === 'rookie' ? 0.7 : 0.84
    const botBaseLane = racingLineOffsetAt(config.circuit, bot.progress) * botLineCommitment
      + Math.sin(bot.progress * Math.PI * 4 + index) * 0.035
    bot.lane += (botBaseLane - bot.lane) * (1 - Math.exp(-dt * 1.4))
    tickPitState(bot, dt)
    bot.collisionCooldown = Math.max(0, bot.collisionCooldown - dt)
    recordRacerLap(bot, previousLap, state.totalLaps)
  })

  manageTrafficAndIncidents(state, config, strategy, dt)
  applyStewardRules(state, config, strategy)

  if (!state.scannerAlert && player.progress >= scannerDetectionPoint(config, state)) {
    state.scannerAlert = true
    state.eventLog.push('Pattern Scanner (' + config.scannerFocus + '): ' + (config.scannerFocus === 'vision' ? 'damp surface pixels detected ahead' : config.scannerFocus === 'telemetry' ? 'rear temperature trend rising before visible rain' : 'rear heat and surface grip pattern diverging'))
  }
  if (!state.needsDecision && !state.pitRequested && !player.inPit && player.progress < state.totalLaps - 0.25 && player.progress >= state.decisionPoint && state.strategyWindowCount < state.strategyWindowLimit) {
    if (shouldOpenStrategyWindow(state)) {
      state.needsDecision = true
      state.decision = null
      state.strategyWindowCount += 1
      const advice = evaluateSystemAdvice(state, config)
      state.adviceAlignment = advice.alignment
      state.eventLog.push('Pit window ' + String(state.strategyWindowCount).padStart(2, '0') + ': ' + (advice.alignment === 'conflict'
        ? 'AI systems disagree — compare the evidence and make the call'
        : 'AI systems agree to ' + (advice.alignment === 'agree-pit' ? 'box this lap' : 'stay out') + ' — final call remains yours'))
    } else {
      state.decisionPoint = Math.min(state.totalLaps + 1, state.decisionPoint + 0.35)
    }
  }
  if (!state.adaptiveAlert && player.progress >= state.rainOnsetProgress + 0.28) {
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
  const pitPhase = player.pitLanePhase || 0
  state.speedKph = player.inPit
    ? pitPhase >= 0.45 && pitPhase <= 0.55 ? 0 : Math.min(80, state.pitSpeedKph ?? 80)
    : Math.round(clamp(96 + playerPace * 2150, 118, 340))
  state.incidentRisk = calculateIncidentRisk(state, config, strategy)
  state.position = rankPlayer(state.racers)

  state.racers.forEach((racer) => { racer.finished = racer.retired || racer.progress >= state.totalLaps })
  if (player.retired) {
    state.finished = true
    state.eventLog.push('Major incident: Neural Apex retired · debriefing the risk factors')
  }
  const timedSessionExpired = config.runType !== 'race' && state.elapsed >= state.sessionDuration
  if (timedSessionExpired) {
    state.finished = true
    state.lastLapSeconds = state.currentLapSeconds
    state.bestLapSeconds = state.bestLapSeconds === null ? state.currentLapSeconds : Math.min(state.bestLapSeconds, state.currentLapSeconds)
    player.bestLapSeconds = state.bestLapSeconds
    state.eventLog.push((config.runType === 'qualifying' ? 'Qualifying' : 'Test session') + ' complete: chequered flag · P' + state.position)
  } else if (player.progress >= state.totalLaps) {
    state.finished = true
    state.lastLapSeconds = state.currentLapSeconds
    state.bestLapSeconds = state.bestLapSeconds === null ? state.currentLapSeconds : Math.min(state.bestLapSeconds, state.currentLapSeconds)
    player.bestLapSeconds = state.bestLapSeconds
    state.eventLog.push('Autonomous run complete: P' + state.position + ' · ' + formatSeconds(state.elapsed))
  }
  return state
}

export function resolveDecision(state: RaceSnapshot, decision: RaceDecision): RaceSnapshot {
  if (!state.needsDecision) return state
  state.decision = decision
  state.needsDecision = false
  state.lastDecisionProgress = state.playerProgress
  state.decisionHistory.push({ window: state.strategyWindowCount, progress: state.playerProgress, choice: decision, alignment: state.adviceAlignment })
  if (decision !== 'stay-out') {
    const targetTyre = decision === 'pit-dry' ? 'c3' : decision === 'pit-wet' ? 'full-wet' : 'intermediate'
    requestPitStop(state, targetTyre)
    state.decisionPoint = state.totalLaps + 1
  } else {
    state.eventLog.push('Race engineer: Stay out · overcut in progress, dry-tyre grip at risk')
    const remainingWindows = state.strategyWindowCount < state.strategyWindowLimit
    const gap = Math.max(0.7, state.totalLaps / (state.strategyWindowLimit + 1) * 0.55)
    const nextWindow = state.playerProgress + gap
    state.decisionPoint = remainingWindows && nextWindow < state.totalLaps - 0.25 ? nextWindow : state.totalLaps + 1
  }
  return state
}

export function requestPitStop(state: RaceSnapshot, tyre: TyreCompound): RaceSnapshot {
  const player = state.racers[0]
  if (state.finished || player.inPit) return state
  state.pitRequested = true
  state.pendingTyre = tyre
  state.pitEntryProgress = Math.floor(player.progress) + 0.9
  state.eventLog.push('Race engineer: Box, box this lap for ' + tyreProfiles[tyre].name + ' · pit confirm')
  return state
}

export function cancelPitStop(state: RaceSnapshot): RaceSnapshot {
  if (!state.pitRequested || state.racers[0].inPit) return state
  state.pitRequested = false
  state.pendingTyre = null
  state.pitEntryProgress = null
  state.eventLog.push('Race engineer: Cancel box call · stay on current strategy')
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
    predictionOutcome: 'The Predictor gave rain a ' + state.forecastRainProbability + '% chance in seeded scenario #' + state.weatherSeed + ' and estimated a ' + formatSeconds(state.predictedLapSeconds) + ' lap. ' + (state.rainWillArrive ? 'Rain arrived near the forecast window.' : 'The forecast did not become rain during this short run.'),
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

export function evaluateSystemAdvice(state: RaceSnapshot, config: RaceConfig): SystemAdvice {
  const predictor: AdviceRecommendation = state.forecastRainProbability >= 58 ? 'pit' : 'stay-out'
  const scannerSeesRisk = state.rain >= .1
    || (config.scannerFocus === 'telemetry' && state.forecastRainProbability >= 68)
    || (config.scannerFocus === 'balanced' && state.rain >= .04)
  const scanner: AdviceRecommendation = scannerSeesRisk ? 'pit' : 'stay-out'
  const driverProtectsFinish = config.priority === 'finish' && state.forecastRainProbability >= 70
  const driverTrustsForecast = config.pitPolicy === 'forecast' && state.forecastRainProbability >= 78
  const adaptiveDriver: AdviceRecommendation = state.rain >= .18 || driverProtectsFinish || driverTrustsForecast ? 'pit' : 'stay-out'
  const votes = [predictor, scanner, adaptiveDriver]
  const alignment: SystemAdvice['alignment'] = votes.every((vote) => vote === 'pit')
    ? 'agree-pit'
    : votes.every((vote) => vote === 'stay-out')
      ? 'agree-stay'
      : 'conflict'
  return { predictor, scanner, adaptiveDriver, alignment }
}

export function predictLapSeconds(config: RaceConfig): number {
  const track = trackProfiles[config.circuit]
  const tyre = -tyreProfiles[config.tyre].dryPace * 145
  const fuel = config.fuel === 'light' ? -0.6 : config.fuel === 'safe' ? 0.7 : 0
  const aero = config.aero === 'speed' ? -0.35 : config.aero === 'grip' ? 0.3 : 0
  const session = config.runType === 'qualifying' ? -0.45 : config.runType === 'test' ? 0.55 : 0
  const priority = config.priority === 'winning' ? -0.28 : config.priority === 'tyres' ? 0.3 : 0
  const style = config.driverStyle === 'aggressive' ? -0.34 : config.driverStyle === 'cautious' ? 0.42 : 0
  return track.lengthKm * 1.75 + tyre + fuel + aero + session + priority + style
}

export function predictIncidentRisk(config: RaceConfig): number {
  const aggression = config.priority === 'winning' ? 6 : config.priority === 'tyres' ? -2 : 0
  const aero = config.aero === 'speed' ? 3 : config.aero === 'grip' ? -2 : 0
  const rivals = config.botPreset === 'competitive' ? 5 : config.botPreset === 'adaptive' ? 3 : config.botPreset === 'rookie' ? -3 : 0
  const tyre = isWetTyre(config.tyre) ? 2 : config.tyre === 'c5' ? 3 : 0
  const policy = config.pitPolicy === 'track-position' ? 3 : config.pitPolicy === 'forecast' ? -1 : 0
  const scanner = config.scannerFocus === 'telemetry' ? -2 : config.scannerFocus === 'vision' ? 1 : 0
  const style = config.driverStyle === 'aggressive' ? 7 : config.driverStyle === 'cautious' ? -4 : 0
  return Math.round(clamp(9 + aggression + aero + rivals + tyre + policy + scanner + style, 3, 39))
}

export function createWeatherForecast(config: RaceConfig): WeatherForecast {
  const baseline = trackProfiles[config.circuit].weather
  const seed = Math.max(1, Math.round(config.weatherSeed || 1))
  const temperatureShift = (seededUnit(seed, 'air') - 0.5) * 5
  const surfaceShift = (seededUnit(seed, 'track') - 0.5) * 9
  const humidityShift = Math.round((seededUnit(seed, 'humidity') - 0.5) * 18)
  const windShift = Math.round((seededUnit(seed, 'wind') - 0.5) * 11)
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const rainProbability = Math.round(38 + seededUnit(seed, 'probability') * 52)
  const laps = clamp(Math.round(config.laps), 1, 32)
  const latestOnset = laps === 1 ? 0.78 : Math.max(0.88, laps * 0.76)
  const rainWillArrive = seededUnit(seed, 'outcome') < rainProbability / 100
  return {
    seed,
    airTemp: roundOne(baseline.airTemp + temperatureShift),
    trackTemp: roundOne(baseline.trackTemp + surfaceShift + temperatureShift * 0.45),
    humidity: Math.round(clamp(baseline.humidity + humidityShift, 35, 94)),
    windKph: Math.round(clamp(baseline.windKph + windShift, 3, 32)),
    windDirection: directions[Math.floor(seededUnit(seed, 'direction') * directions.length) % directions.length],
    rainProbability,
    rainOnsetProgress: roundTwo(0.56 + seededUnit(seed, 'onset') * (latestOnset - 0.56)),
    rainPeak: 0.52 + seededUnit(seed, 'peak') * 0.45,
    rainWillArrive,
  }
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

export function tyreStrategyWindowProgress(totalLaps: number, tyre: TyreCompound): number {
  const laps = clamp(Math.round(totalLaps), 1, 32)
  const fraction = tyre === 'c4' || tyre === 'c5'
    ? 0.25
    : tyre === 'c3'
      ? 0.5
      : tyre === 'c1' || tyre === 'c2'
        ? 0.75
        : 0.33
  return clamp(laps * fraction, 0.65, laps - 0.3)
}

export function brakingRateFor(style: RaceConfig['driverStyle'], effectiveCornerSeverity: number): number {
  const baseRate = style === 'aggressive' ? 0.3 : style === 'cautious' ? 0.38 : 0.34
  const severityBoost = style === 'cautious' ? 0.12 : 0.1
  return baseRate + clamp(effectiveCornerSeverity, 0, 1) * severityBoost
}

function updateWeather(state: RaceSnapshot, config: RaceConfig): void {
  const rainGrowth = smoothstep(state.rainOnsetProgress, state.rainOnsetProgress + 0.72, state.playerProgress)
  const stormPulse = Math.sin(state.elapsed * 0.11 + state.weatherSeed) * 0.035
  state.rain = clamp(rainGrowth * state.rainPeak + stormPulse * rainGrowth, 0, 1)
  state.humidity = Math.round(clamp(state.baseHumidity + state.rain * 24 + Math.sin(state.elapsed * 0.16 + state.weatherSeed) * 2, 35, 99))
  state.airTemp = roundOne(state.baseAirTemp - state.rain * 2.6 + Math.sin(state.elapsed * 0.08 + state.weatherSeed) * 0.4)
  state.trackTemp = roundOne(state.baseTrackTemp - state.rain * 11 - state.elapsed * 0.018)
  state.windKph = Math.round(clamp(state.baseWindKph + Math.sin(state.elapsed * 0.35 + state.weatherSeed) * 5 + state.rain * 4, 2, 38))
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
function driverStylePace(config: RaceConfig): number { return config.driverStyle === 'aggressive' ? 0.0025 : config.driverStyle === 'cautious' ? -0.0015 : 0 }
function sessionPace(config: RaceConfig): number { return config.runType === 'qualifying' ? 0.004 : config.runType === 'test' ? -0.003 : 0 }
function policyPace(config: RaceConfig, state: RaceSnapshot): number {
  if (config.pitPolicy === 'forecast') return state.playerProgress > state.rainOnsetProgress - 0.22 && state.rain < 0.2 ? -0.0012 : 0
  if (config.pitPolicy === 'reactive') return state.rain < 0.2 ? 0.001 : -0.0018
  return state.rain < 0.45 ? 0.0015 : -0.0025
}
function difficultyPace(config: RaceConfig, state: RaceSnapshot): number { return config.difficulty === 'rookie' ? -0.004 : config.difficulty === 'adaptive' && state.playerProgress > 1 ? 0.003 : 0 }
function scannerDetectionPoint(config: RaceConfig, state: RaceSnapshot): number {
  const lead = config.scannerFocus === 'telemetry' ? 0.42 : config.scannerFocus === 'vision' ? 0.2 : 0.31
  return Math.max(0.22, state.rainOnsetProgress - lead)
}

function strategyWindowLimit(laps: number): number {
  if (laps <= 1) return 1
  return Math.min(4, Math.ceil(laps / 8) + 1)
}

function shouldOpenStrategyWindow(state: RaceSnapshot): boolean {
  if (state.strategyWindowCount === 0) {
    const wrongSurfaceTyre = isWetTyre(state.activeTyre) && state.rain < 0.12
    const weatherEvidence = state.forecastRainProbability >= 58 || state.rain >= 0.08 || state.scannerAlert
    const baselineReview = state.totalLaps >= 3
    return wrongSurfaceTyre || weatherEvidence || baselineReview
  }
  const escalationThreshold = 0.12 + Math.max(0, state.strategyWindowCount - 1) * 0.2
  return state.rainWillArrive && (state.rain >= escalationThreshold || state.grip <= 72)
}

function tyreWearRate(tyre: TyreCompound, strategy: StrategyCommand, rain: number, trackTemp: number, priority: RaceConfig['priority'], driverStyle: RaceConfig['driverStyle']): number {
  const profile = tyreProfiles[tyre]
  const wrongSurface = isWetTyre(tyre) ? Math.max(0, 0.35 - rain) * 3.8 : rain * 1.8
  const heat = trackTemp > 36 && !isWetTyre(tyre) ? (trackTemp - 36) * 0.06 : 0
  const command = strategy === 'push' ? 0.9 : strategy === 'conserve' ? -0.55 : 0
  const priorityRate = priority === 'tyres' ? -0.25 : priority === 'winning' ? 0.3 : 0
  const styleRate = driverStyle === 'aggressive' ? 0.5 : driverStyle === 'cautious' ? -0.3 : 0
  return Math.max(0.55, profile.wearRate + wrongSurface + heat + command + priorityRate + styleRate)
}

function fuelBurnRate(config: RaceConfig, strategy: StrategyCommand, laps: number): number {
  const base = config.fuel === 'light' ? 1.7 : config.fuel === 'safe' ? 1.25 : 1.45
  const lapScale = 3 / Math.max(1, laps)
  const style = config.driverStyle === 'aggressive' ? 0.22 : config.driverStyle === 'cautious' ? -0.14 : 0
  return (base + (strategy === 'push' ? 0.35 : strategy === 'conserve' ? -0.25 : 0) + style) * lapScale
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
  const elapsedRatio = racer.pitStopDuration ? clamp(1 - racer.pitTimeRemaining / racer.pitStopDuration, 0, 1) : 0
  racer.pitLanePhase = elapsedRatio < 0.3
    ? elapsedRatio / 0.3 * 0.45
    : elapsedRatio < 0.7
      ? 0.5
      : 0.55 + (elapsedRatio - 0.7) / 0.3 * 0.45
  racer.inPit = racer.pitTimeRemaining > 0
  if (!racer.inPit && racer.pitExitProgress !== undefined) {
    racer.progress = Math.max(racer.progress, racer.pitExitProgress)
    racer.pitLanePhase = 1
  }
}

function enterScheduledPit(state: RaceSnapshot): void {
  const player = state.racers[0]
  if (!state.pitRequested || state.pitEntryProgress === null || !state.pendingTyre || player.progress < state.pitEntryProgress) return
  const targetTyre = state.pendingTyre
  player.inPit = true
  player.pitTimeRemaining = targetTyre === 'full-wet' ? 5.4 : 5.1
  player.pitStopDuration = player.pitTimeRemaining
  player.pitLanePhase = 0
  player.pitExitProgress = Math.floor(player.progress) + 1.1
  state.pitTimeRemaining = player.pitTimeRemaining
  state.pitRequested = false
  state.pitEntryProgress = null
  state.eventLog.push('Box, box: pit limiter engaged · ' + tyreProfiles[targetTyre].name + ' prepared at the service bay')
}

function manageTrafficAndIncidents(state: RaceSnapshot, config: RaceConfig, strategy: StrategyCommand, dt: number): void {
  const active = state.racers.filter((racer) => !racer.retired && !racer.inPit)
  for (const trailing of active) {
    const leading = active
      .filter((candidate) => candidate !== trailing && candidate.progress > trailing.progress)
      .sort((a, b) => a.progress - b.progress)[0]
    if (!leading) continue
    const progressGap = leading.progress - trailing.progress
    const passThreshold = trailing.id === 'player'
      ? config.driverStyle === 'aggressive' ? 0.995 : config.driverStyle === 'cautious' ? 1.015 : 1.002
      : config.botPreset === 'competitive' ? 0.997 : config.botPreset === 'rookie' ? 1.018 : 1.004
    if (progressGap > 0.045 || trailing.speed <= leading.speed * passThreshold) continue
    const passSide = deterministicRoll(0, trailing.id, leading.id) > 0.5 ? 1 : -1
    const targetLane = passSide * 0.92
    trailing.lane += (targetLane - trailing.lane) * (1 - Math.exp(-dt * 3.2))
  }

  for (let first = 0; first < state.racers.length; first += 1) {
    for (let second = first + 1; second < state.racers.length; second += 1) {
      const a = state.racers[first]
      const b = state.racers[second]
      if (a.retired || b.retired || a.inPit || b.inPit) continue
      const progressGap = Math.abs(a.progress - b.progress)
      const laneGap = Math.abs(a.lane - b.lane)
      if (progressGap > 0.012 || laneGap > 0.58) continue

      const trailing = a.progress <= b.progress ? a : b
      const leading = trailing === a ? b : a

      const contactWindow = progressGap <= 0.0045 && laneGap <= 0.48 && a.collisionCooldown <= 0 && b.collisionCooldown <= 0
      if (contactWindow) {
        a.collisionCooldown = 0.8
        b.collisionCooldown = 0.8
        const risk = calculateIncidentRisk(state, config, strategy) / 100
        if (deterministicRoll(state.elapsed * 1.7, a.id, b.id) <= risk) {
          const major = deterministicRoll(state.elapsed * 2.3, b.id, a.id) < 0.18 + state.rain * 0.34
          applyCollisionOutcome(state, trailing, leading, major ? 'major' : 'minor', 'risk ' + Math.round(risk * 100) + '% · ' + (state.rain > 0.3 ? 'wet grip' : strategy + ' pace'))
        }
      }
      const updatedLaneGap = Math.abs(a.lane - b.lane)
      if (progressGap < 0.0065 && updatedLaneGap < 0.52) {
        trailing.progress = Math.min(trailing.progress, leading.progress - 0.0065)
        trailing.speed = Math.min(trailing.speed, leading.speed * 0.995)
      }
    }
  }
}

function applyStewardRules(state: RaceSnapshot, config: RaceConfig, strategy: StrategyCommand): void {
  const player = state.racers[0]
  const lapFraction = positiveModulo(player.progress, 1)
  const trackLimitWindow = (lapFraction > .34 && lapFraction < .355) || (lapFraction > .78 && lapFraction < .795)
  const styleRisk = config.driverStyle === 'aggressive' ? .08 : config.driverStyle === 'cautious' ? -.025 : 0
  const limitRisk = .05 + state.rain * .13 + (strategy === 'push' ? .12 : 0) + (config.aero === 'speed' ? .05 : 0) + (config.priority === 'winning' ? .05 : 0) + styleRisk
  // Road half-width is 3.6 and the car half-width is about 1.05.
  // With lane units scaled by 2.35, 1.04 is close to the all-wheels-off boundary.
  const beyondPhysicalLimit = Math.abs(player.lane) > 1.04
  if (state.trackLimitCooldown <= 0 && (beyondPhysicalLimit || (trackLimitWindow && deterministicRoll(state.elapsed * .8, 'limits', player.id) < limitRisk))) {
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
function seededUnit(seed: number, salt: string): number { return Math.abs(Math.sin(seed * 12.9898 + stringScore(salt) * 78.233) * 43758.5453) % 1 }
function smoothstep(edge0: number, edge1: number, value: number): number { const t = clamp((value - edge0) / (edge1 - edge0), 0, 1); return t * t * (3 - 2 * t) }
function positiveModulo(value: number, divisor: number): number { return ((value % divisor) + divisor) % divisor }

function rankPlayer(racers: RacerState[]): number { return [...racers].sort((a, b) => Number(a.retired) - Number(b.retired) || b.progress - a.progress).findIndex((racer) => racer.id === 'player') + 1 }
function roundOne(value: number): number { return Math.round(value * 10) / 10 }
function roundTwo(value: number): number { return Math.round(value * 100) / 100 }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)) }
