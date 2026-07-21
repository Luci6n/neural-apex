import { useCallback, useEffect, useState } from 'react'
import { DebriefScreen } from '../features/debrief/DebriefScreen'
import { IntroScreen } from '../features/intro/IntroScreen'
import { RaceExperience } from '../features/race/RaceExperience'
import { SetupScreen } from '../features/setup/SetupScreen'
import { TutorialScreen } from '../features/tutorial/TutorialScreen'
import { createRunRecord, defaultConfig } from '../simulation'
import type { CircuitId, RaceConfig, RaceSnapshot, RunRecord } from '../simulation'
import { routeForScreen, screenFromLocation } from './navigation'
import type { AppScreen, TutorialReturn } from './navigation'
import { readSession, removeSession, sessionKeys, writeSession } from './session'

export function App() {
  const [screen, setScreen] = useState<AppScreen>(screenFromLocation)
  const [principalName, setPrincipalName] = useState(() => sessionStorage.getItem(sessionKeys.principal) || '')
  const [config, setConfigState] = useState<RaceConfig>(() => {
    const stored = readSession<RaceConfig>(sessionKeys.config)
    const params = new URLSearchParams(window.location.search)
    const circuit = params.get('circuit') || params.get('qa')
    const circuits: CircuitId[] = ['ardennes', 'british', 'catalunya']
    const base = stored || { ...defaultConfig, weatherSeed: Math.floor(1000 + Math.random() * 9000) }
    return circuits.includes(circuit as CircuitId) ? { ...base, circuit: circuit as CircuitId } : base
  })
  const [finalRace, setFinalRace] = useState<RaceSnapshot | null>(() => readSession(sessionKeys.finalRace))
  const [runs, setRuns] = useState<RunRecord[]>(() => readSession(sessionKeys.runs) || [])
  const [tutorialReturn, setTutorialReturn] = useState<TutorialReturn>(() => sessionStorage.getItem(sessionKeys.tutorialReturn) === 'setup' ? 'setup' : 'intro')

  const navigate = useCallback((next: AppScreen, replace = false) => {
    const url = routeForScreen(next)
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url)
    setScreen(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onPopState = () => setScreen(screenFromLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setConfig = (next: RaceConfig) => {
    setConfigState(next)
    writeSession(sessionKeys.config, next)
  }

  const enterLab = (name = principalName || 'Team Principal') => {
    const resolvedName = name.trim() || 'Team Principal'
    setPrincipalName(resolvedName)
    writeSession(sessionKeys.principal, resolvedName)
    navigate('setup')
  }

  const openTutorial = (from: TutorialReturn) => {
    setTutorialReturn(from)
    writeSession(sessionKeys.tutorialReturn, from)
    navigate('tutorial')
  }

  if (screen === 'intro') return <IntroScreen initialName={principalName} onEnter={enterLab} onTutorial={() => openTutorial('intro')} />
  if (screen === 'tutorial') return <TutorialScreen onBack={() => navigate(tutorialReturn)} onStart={() => enterLab()} />
  if (screen === 'setup') return <SetupScreen config={config} principalName={principalName || 'Team Principal'} lastRun={runs.at(-1)} onChange={setConfig} onStart={() => { setFinalRace(null); removeSession(sessionKeys.finalRace); navigate('race') }} onTutorial={() => openTutorial('setup')} onMain={() => navigate('intro')} />
  if (screen === 'race') return <RaceExperience config={config} principalName={principalName || 'Team Principal'} onFinish={(race) => {
    const nextRuns = [...runs, createRunRecord(race, config, runs.length + 1)]
    setFinalRace(race); setRuns(nextRuns)
    writeSession(sessionKeys.finalRace, race); writeSession(sessionKeys.runs, nextRuns)
    navigate('debrief')
  }} onExit={() => navigate('setup')} />
  return <DebriefScreen race={finalRace} config={config} currentRun={runs.at(-1)} previousRun={runs.at(-2)} onRunAgain={() => navigate('race')} onAdjust={() => navigate('setup')} />
}
