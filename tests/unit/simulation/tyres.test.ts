import { describe, expect, it } from 'vitest'

import { isWetTyre, tyreOptions, tyreProfiles } from '../../../src/simulation/tyres'

describe('tyre profiles', () => {
  it('exposes five ordered dry compounds and two wet compounds', () => {
    expect(tyreOptions.map(([compound]) => compound)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'intermediate', 'full-wet'])
    expect(isWetTyre('intermediate')).toBe(true)
    expect(isWetTyre('full-wet')).toBe(true)
    expect(isWetTyre('c3')).toBe(false)
  })

  it('trades dry pace for wear from C1 through C5', () => {
    expect(tyreProfiles.c5.dryPace).toBeGreaterThan(tyreProfiles.c1.dryPace)
    expect(tyreProfiles.c5.wearRate).toBeGreaterThan(tyreProfiles.c1.wearRate)
    expect(tyreProfiles['full-wet'].wetPace).toBeGreaterThan(tyreProfiles.c5.wetPace)
  })
})
