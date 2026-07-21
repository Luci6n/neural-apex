export type GameMode = 'guided' | 'quick' | 'free'
export type Difficulty = 'rookie' | 'professional' | 'adaptive'
export type ScannerFocus = 'vision' | 'balanced' | 'telemetry'
export type DriverPriority = 'finish' | 'tyres' | 'winning'
export type DriverStyle = 'cautious' | 'balanced' | 'aggressive'
export type BotPreset = 'rookie' | 'balanced' | 'competitive' | 'adaptive'
export type RaceDecision = 'pit-dry' | 'pit-intermediate' | 'pit-wet' | 'stay-out'
export type AdviceRecommendation = 'pit' | 'stay-out'
export type AdviceAlignment = 'pending' | 'agree-pit' | 'agree-stay' | 'conflict'
export type RunType = 'test' | 'qualifying' | 'race'
export type TyreCompound = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'intermediate' | 'full-wet'
export type FuelStrategy = 'light' | 'balanced' | 'safe'
export type AeroBalance = 'speed' | 'balanced' | 'grip'
export type PitPolicy = 'forecast' | 'reactive' | 'track-position'
export type StrategyCommand = 'push' | 'balanced' | 'conserve'
export type CircuitId = 'ardennes' | 'british' | 'catalunya'
export type DamageLevel = 'none' | 'minor' | 'major'

export interface StrategyDecisionRecord {
  window: number
  progress: number
  choice: RaceDecision
  alignment: AdviceAlignment
}

export interface RaceConfig {
  mode: GameMode
  circuit: CircuitId
  runType: RunType
  laps: number
  difficulty: Difficulty
  tyre: TyreCompound
  fuel: FuelStrategy
  aero: AeroBalance
  pitPolicy: PitPolicy
  scannerFocus: ScannerFocus
  priority: DriverPriority
  driverStyle: DriverStyle
  botPreset: BotPreset
  weatherSeed: number
}

export interface RacerState {
  id: string
  name: string
  color: string
  progress: number
  lane: number
  speed: number
  adaptive: boolean
  tyre: TyreCompound
  inPit: boolean
  finished: boolean
  bestLapSeconds: number | null
  lastLapStarted: number
  pitTimeRemaining: number
  pitStopDuration?: number
  pitLanePhase?: number
  pitExitProgress?: number
  collisionCooldown: number
  damage: DamageLevel
  retired: boolean
}

export interface RaceSnapshot {
  elapsed: number
  totalLaps: number
  sessionDuration: number
  lap: number
  lapProgress: number
  position: number
  playerProgress: number
  speedKph: number
  rain: number
  airTemp: number
  trackTemp: number
  humidity: number
  windKph: number
  windDirection: string
  weatherSeed: number
  baseAirTemp: number
  baseTrackTemp: number
  baseHumidity: number
  baseWindKph: number
  rainOnsetProgress: number
  rainPeak: number
  rainWillArrive: boolean
  decisionPoint: number
  strategyWindowCount: number
  strategyWindowLimit: number
  lastDecisionProgress: number
  forecastRainProbability: number
  tyreWear: number
  fuelRemaining: number
  grip: number
  activeTyre: TyreCompound
  strategyCommand: StrategyCommand
  predictedLapSeconds: number
  currentLapSeconds: number
  lastLapSeconds: number | null
  bestLapSeconds: number | null
  scannerAlert: boolean
  adaptiveAlert: boolean
  needsDecision: boolean
  decision: RaceDecision | null
  decisionHistory: StrategyDecisionRecord[]
  adviceAlignment: AdviceAlignment
  finished: boolean
  racers: RacerState[]
  eventLog: string[]
  pitTimeRemaining: number
  pitRequested: boolean
  pitEntryProgress: number | null
  pendingTyre: TyreCompound | null
  incidentRisk: number
  trackLimitStrikes: number
  trackLimitCooldown: number
  penaltySeconds: number
  penalties: string[]
  pitSpeedKph: number | null
  pitSpeedViolationChecked: boolean
}

export interface DebriefData {
  position: number
  score: number
  decision: RaceDecision
  totalSeconds: number
  predictionOutcome: string
  patternOutcome: string
  adaptationOutcome: string
  lesson: string
}

export interface RunRecord {
  id: number
  config: RaceConfig
  position: number
  totalSeconds: number
  bestLapSeconds: number | null
  tyreWear: number
  fuelRemaining: number
  decision: RaceDecision
  score: number
}
