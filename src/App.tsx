import { useCallback, useEffect, useState } from 'react'
import { DebriefScreen } from './features/debrief/DebriefScreen'
import { IntroScreen } from './features/intro/IntroScreen'
import { RaceExperience } from './features/race/RaceExperience'
import { SetupScreen } from './features/setup/SetupScreen'
import { TutorialScreen } from './features/tutorial/TutorialScreen'
import { defaultConfig } from './game/config'
import { createRunRecord } from './game/simulation'
import type { CircuitId, RaceConfig, RaceSnapshot, RunRecord } from './game/types'

type Screen = 'intro' | 'tutorial' | 'setup' | 'race' | 'debrief'
type TutorialReturn = 'intro' | 'setup'

const routes: Record<Screen, string> = { intro: '/', tutorial: '/tutorial', setup: '/setup', race: '/race', debrief: '/result' }

export function App() {
  const [screen, setScreen] = useState<Screen>(screenFromLocation)
  const [principalName, setPrincipalName] = useState(() => sessionStorage.getItem('neural-apex-principal') || '')
  const [config, setConfigState] = useState<RaceConfig>(() => {
    const stored = readSession<RaceConfig>('neural-apex-config')
    const params = new URLSearchParams(window.location.search)
    const circuit = params.get('circuit') || params.get('qa')
    const circuits: CircuitId[] = ['ardennes', 'british', 'catalunya']
    const base = stored || { ...defaultConfig, weatherSeed: Math.floor(1000 + Math.random() * 9000) }
    return circuits.includes(circuit as CircuitId) ? { ...base, circuit: circuit as CircuitId } : base
  })
  const [finalRace, setFinalRace] = useState<RaceSnapshot | null>(() => readSession('neural-apex-final-race'))
  const [runs, setRuns] = useState<RunRecord[]>(() => readSession('neural-apex-runs') || [])
  const [tutorialReturn, setTutorialReturn] = useState<TutorialReturn>(() => sessionStorage.getItem('neural-apex-tutorial-return') === 'setup' ? 'setup' : 'intro')

  const navigate = useCallback((next: Screen, replace = false) => {
    const keepQaHooks = new URLSearchParams(window.location.search).get('qaHooks') === '1'
    const url = routes[next] + (keepQaHooks ? '?qaHooks=1' : '')
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
    sessionStorage.setItem('neural-apex-config', JSON.stringify(next))
  }

  const enterLab = (name = principalName || 'Team Principal') => {
    const resolvedName = name.trim() || 'Team Principal'
    setPrincipalName(resolvedName)
    sessionStorage.setItem('neural-apex-principal', resolvedName)
    navigate('setup')
  }

  const openTutorial = (from: TutorialReturn) => {
    setTutorialReturn(from)
    sessionStorage.setItem('neural-apex-tutorial-return', from)
    navigate('tutorial')
  }

  if (screen === 'intro') return <IntroScreen initialName={principalName} onEnter={enterLab} onTutorial={() => openTutorial('intro')} />
  if (screen === 'tutorial') return <TutorialScreen onBack={() => navigate(tutorialReturn)} onStart={() => enterLab()} />
  if (screen === 'setup') return <SetupScreen config={config} principalName={principalName || 'Team Principal'} lastRun={runs.at(-1)} onChange={setConfig} onStart={() => { setFinalRace(null); sessionStorage.removeItem('neural-apex-final-race'); navigate('race') }} onTutorial={() => openTutorial('setup')} onMain={() => navigate('intro')} />
  if (screen === 'race') return <RaceExperience config={config} principalName={principalName || 'Team Principal'} onFinish={(race) => {
    const nextRuns = [...runs, createRunRecord(race, config, runs.length + 1)]
    setFinalRace(race); setRuns(nextRuns)
    sessionStorage.setItem('neural-apex-final-race', JSON.stringify(race)); sessionStorage.setItem('neural-apex-runs', JSON.stringify(nextRuns))
    navigate('debrief')
  }} onExit={() => navigate('setup')} />
  return <DebriefScreen race={finalRace} config={config} currentRun={runs.at(-1)} previousRun={runs.at(-2)} onRunAgain={() => navigate('race')} onAdjust={() => navigate('setup')} />
}

function screenFromLocation(): Screen {
  const params = new URLSearchParams(window.location.search)
  const qa = params.get('qa')
  if (qa === 'race' || qa === 'ardennes' || qa === 'british' || qa === 'catalunya') return 'race'
  if (params.get('qaHooks') === '1' && window.location.pathname === '/') return 'setup'
  if (window.location.pathname === '/tutorial') return 'tutorial'
  if (window.location.pathname === '/setup') return 'setup'
  if (window.location.pathname === '/race') return 'race'
  if (window.location.pathname === '/result') return 'debrief'
  return 'intro'
}

function readSession<Value>(key: string): Value | null {
  try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as Value : null } catch { return null }
}
