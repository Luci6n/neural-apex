import type { TyreCompound } from './types'

export interface TyreProfile {
  code: string
  name: string
  className: string
  color: string
  dryPace: number
  wetPace: number
  wearRate: number
}

export const tyreProfiles: Record<TyreCompound, TyreProfile> = {
  c1: { code: 'C1', name: 'C1 · Hardest', className: 'Hard', color: '#f4f4ef', dryPace: -0.003, wetPace: -0.014, wearRate: 1.05 },
  c2: { code: 'C2', name: 'C2 · Hard', className: 'Hard', color: '#f4f4ef', dryPace: -0.0015, wetPace: -0.013, wearRate: 1.2 },
  c3: { code: 'C3', name: 'C3 · Medium', className: 'Medium', color: '#ffd546', dryPace: 0, wetPace: -0.012, wearRate: 1.5 },
  c4: { code: 'C4', name: 'C4 · Soft', className: 'Soft', color: '#ff544c', dryPace: 0.0025, wetPace: -0.014, wearRate: 1.9 },
  c5: { code: 'C5', name: 'C5 · Softest', className: 'Soft', color: '#ff544c', dryPace: 0.004, wetPace: -0.016, wearRate: 2.35 },
  intermediate: { code: 'I', name: 'Intermediate', className: 'Wet', color: '#56d978', dryPace: -0.006, wetPace: 0.004, wearRate: 1.75 },
  'full-wet': { code: 'W', name: 'Full Wet', className: 'Wet', color: '#59a9ff', dryPace: -0.01, wetPace: 0.006, wearRate: 1.45 },
}

export const tyreOptions = (Object.keys(tyreProfiles) as TyreCompound[]).map(
  (compound) => [compound, tyreProfiles[compound].name] as [TyreCompound, string],
)

export function isWetTyre(compound: TyreCompound): boolean {
  return compound === 'intermediate' || compound === 'full-wet'
}
