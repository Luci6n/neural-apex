import { describe, expect, it } from 'vitest'

import { routeForScreen, screenFromLocation } from '../../../src/app/navigation'

function location(pathname: string, search = ''): Location {
  return { pathname, search } as Location
}

describe('application navigation', () => {
  it('maps public URLs to distinct application screens', () => {
    expect(screenFromLocation(location('/'))).toBe('intro')
    expect(screenFromLocation(location('/tutorial'))).toBe('tutorial')
    expect(screenFromLocation(location('/setup'))).toBe('setup')
    expect(screenFromLocation(location('/race'))).toBe('race')
    expect(screenFromLocation(location('/result'))).toBe('debrief')
  })

  it('keeps QA race shortcuts and hooks deterministic', () => {
    expect(screenFromLocation(location('/', '?qa=british'))).toBe('race')
    expect(screenFromLocation(location('/', '?qaHooks=1'))).toBe('setup')
    expect(routeForScreen('race', location('/setup', '?qaHooks=1'))).toBe('/race?qaHooks=1')
  })
})
