import { useState } from 'react'
import { DebriefScreen } from './features/debrief/DebriefScreen'
import { RaceExperience } from './features/race/RaceExperience'
import { SetupScreen } from './features/setup/SetupScreen'
import { IntroScreen } from './features/intro/IntroScreen'
import { TutorialScreen } from './features/tutorial/TutorialScreen'
import { defaultConfig } from './game/config'
import { createRunRecord } from './game/simulation'
import type { CircuitId, RaceConfig, RaceSnapshot, RunRecord } from './game/types'

export function App() {
  const [screen, setScreen] = useState<'intro' | 'tutorial' | 'setup' | 'race' | 'debrief'>(() => {
    const params = new URLSearchParams(window.location.search)
    const qa = params.get('qa')
    return qa === 'race' || qa === 'ardennes' || qa === 'british' || qa === 'catalunya'
      ? 'race'
      : params.get('qaHooks') === '1' ? 'setup' : 'intro'
  })
  const [principalName, setPrincipalName] = useState(() => sessionStorage.getItem('neural-apex-principal') || '')
  const [config, setConfig] = useState<RaceConfig>(() => {
    const params = new URLSearchParams(window.location.search)
    const circuit = params.get('circuit') || params.get('qa')
    const circuits: CircuitId[] = ['ardennes', 'british', 'catalunya']
    return circuits.includes(circuit as CircuitId)
      ? { ...defaultConfig, circuit: circuit as CircuitId }
      : defaultConfig
  })
  const [finalRace, setFinalRace] = useState<RaceSnapshot | null>(null)
  const [runs, setRuns] = useState<RunRecord[]>([])

  const enterLab = (name = principalName || 'Team Principal') => {
    const resolvedName = name.trim() || 'Team Principal'
    setPrincipalName(resolvedName)
    sessionStorage.setItem('neural-apex-principal', resolvedName)
    setScreen('setup')
  }

  if (screen === 'intro') return <IntroScreen initialName={principalName} onEnter={enterLab} onTutorial={() => setScreen('tutorial')} />
  if (screen === 'tutorial') return <TutorialScreen onBack={() => setScreen('intro')} onStart={() => enterLab()} />

  if (screen === 'setup') {
    return (
      <SetupScreen
        config={config}
        principalName={principalName || 'Team Principal'}
        lastRun={runs.at(-1)}
        onChange={setConfig}
        onStart={() => {
          setFinalRace(null)
          setScreen('race')
        }}
        onTutorial={() => setScreen('tutorial')}
      />
    )
  }

  if (screen === 'race') {
    return (
      <RaceExperience
        config={config}
        principalName={principalName || 'Team Principal'}
        onFinish={(race) => {
          setFinalRace(race)
          setRuns((current) => [...current, createRunRecord(race, config, current.length + 1)])
          setScreen('debrief')
        }}
        onExit={() => setScreen('setup')}
      />
    )
  }

  return (
    <DebriefScreen
      race={finalRace}
      config={config}
      currentRun={runs.at(-1)}
      previousRun={runs.at(-2)}
      onRunAgain={() => setScreen('race')}
      onAdjust={() => setScreen('setup')}
    />
  )
}
