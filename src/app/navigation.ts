export type AppScreen = 'intro' | 'tutorial' | 'setup' | 'race' | 'debrief'
export type TutorialReturn = 'intro' | 'setup'

const routes: Record<AppScreen, string> = {
  intro: '/',
  tutorial: '/tutorial',
  setup: '/setup',
  race: '/race',
  debrief: '/result',
}

export function screenFromLocation(location: Location = window.location): AppScreen {
  const params = new URLSearchParams(location.search)
  const qa = params.get('qa')
  if (qa === 'race' || qa === 'ardennes' || qa === 'british' || qa === 'catalunya') return 'race'
  if (params.get('qaHooks') === '1' && location.pathname === '/') return 'setup'
  if (location.pathname === '/tutorial') return 'tutorial'
  if (location.pathname === '/setup') return 'setup'
  if (location.pathname === '/race') return 'race'
  if (location.pathname === '/result') return 'debrief'
  return 'intro'
}

export function routeForScreen(screen: AppScreen, location: Location = window.location): string {
  const keepQaHooks = new URLSearchParams(location.search).get('qaHooks') === '1'
  return routes[screen] + (keepQaHooks ? '?qaHooks=1' : '')
}
