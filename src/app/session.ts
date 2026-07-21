export const sessionKeys = {
  principal: 'neural-apex-principal',
  config: 'neural-apex-config',
  finalRace: 'neural-apex-final-race',
  runs: 'neural-apex-runs',
  tutorialReturn: 'neural-apex-tutorial-return',
} as const

export function readSession<Value>(key: string): Value | null {
  try {
    const value = sessionStorage.getItem(key)
    return value ? JSON.parse(value) as Value : null
  } catch {
    return null
  }
}

export function writeSession(key: string, value: unknown): void {
  sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
}

export function removeSession(key: string): void {
  sessionStorage.removeItem(key)
}
