import type { BotPreset, RaceConfig, RacerState } from './types'

export const defaultConfig: RaceConfig = {
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

const botFields: Record<BotPreset, Omit<RacerState, 'progress' | 'speed' | 'inPit' | 'finished' | 'bestLapSeconds' | 'lastLapStarted' | 'pitTimeRemaining' | 'collisionCooldown' | 'damage' | 'retired'>[]> = {
  rookie: [
    { id: 'bot-1', name: 'Cobalt Cub', color: '#4da8ff', lane: -0.55, adaptive: false, tyre: 'c3' },
    { id: 'bot-2', name: 'Mint Comet', color: '#66ddaa', lane: 0.55, adaptive: false, tyre: 'c2' },
    { id: 'bot-3', name: 'Sunset Byte', color: '#ffbb55', lane: 0.05, adaptive: false, tyre: 'c4' },
  ],
  balanced: [
    { id: 'bot-1', name: 'Cobalt Cub', color: '#4da8ff', lane: -0.6, adaptive: false, tyre: 'c3' },
    { id: 'bot-2', name: 'Mint Comet', color: '#66ddaa', lane: 0.58, adaptive: false, tyre: 'c2' },
    { id: 'bot-3', name: 'Sunset Byte', color: '#ffbb55', lane: 0.15, adaptive: false, tyre: 'c4' },
    { id: 'bot-4', name: 'Violet Vector', color: '#aa88ff', lane: -0.12, adaptive: true, tyre: 'c3' },
  ],
  competitive: [
    { id: 'bot-1', name: 'Cobalt Cub', color: '#4da8ff', lane: -0.7, adaptive: false, tyre: 'c3' },
    { id: 'bot-2', name: 'Mint Comet', color: '#66ddaa', lane: 0.7, adaptive: false, tyre: 'c2' },
    { id: 'bot-3', name: 'Sunset Byte', color: '#ffbb55', lane: 0.22, adaptive: false, tyre: 'c4' },
    { id: 'bot-4', name: 'Violet Vector', color: '#aa88ff', lane: -0.25, adaptive: true, tyre: 'c3' },
    { id: 'bot-5', name: 'Redline Logic', color: '#ff5d58', lane: 0.02, adaptive: true, tyre: 'c5' },
  ],
  adaptive: [
    { id: 'bot-1', name: 'Violet Vector', color: '#aa88ff', lane: -0.6, adaptive: true, tyre: 'c3' },
    { id: 'bot-2', name: 'Redline Logic', color: '#ff5d58', lane: 0.6, adaptive: true, tyre: 'c4' },
    { id: 'bot-3', name: 'Ghost Gradient', color: '#b9c8d8', lane: 0.05, adaptive: true, tyre: 'c2' },
  ],
}

export function createBotGrid(preset: BotPreset): RacerState[] {
  return botFields[preset].map((bot, index) => ({
    ...bot,
    progress: -0.018 * (index + 1),
    speed: 0,
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
  }))
}

export const botPresetLabels: Record<BotPreset, { title: string; detail: string }> = {
  rookie: { title: 'Rookie Grid', detail: '3 forgiving rivals' },
  balanced: { title: 'Balanced Grid', detail: '4 mixed rivals' },
  competitive: { title: 'Competitive Grid', detail: '5 fast rivals' },
  adaptive: { title: 'Adaptive Rivals', detail: '3 rivals that react' },
}
