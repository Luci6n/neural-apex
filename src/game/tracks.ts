import * as THREE from 'three'
import type { CircuitId } from './types'

export interface TrackProfile {
  id: CircuitId
  name: string
  inspiration: string
  lengthKm: number
  corners: number
  character: string
  pace: number
  weather: { airTemp: number; trackTemp: number; humidity: number; windKph: number; windDirection: string }
  points: Array<[number, number, number]>
}

export const trackProfiles: Record<CircuitId, TrackProfile> = {
  ardennes: {
    id: 'ardennes',
    name: 'Ardennes Rise',
    inspiration: 'Spa-inspired',
    lengthKm: 7.004,
    corners: 16,
    character: 'Elevation · long straights · changing weather',
    pace: 0.09,
    weather: { airTemp: 21, trackTemp: 29, humidity: 72, windKph: 14, windDirection: 'SW' },
    points: [
      [-47, 0.0, -23], [-43, 0.0, -14], [-38, 0.1, -9], [-32, 0.3, -5],
      [-28, 0.7, -1], [-26, 1.8, 4], [-23, 3.0, 8], [-20, 4.4, 9],
      [-15, 5.4, 11], [-9, 6.0, 16], [-2, 6.2, 20], [7, 6.0, 23],
      [20, 5.6, 27], [25, 5.3, 29], [28, 5.1, 27], [31, 5.0, 26],
      [34, 4.7, 28], [38, 4.2, 29], [41, 3.6, 26], [44, 3.0, 22],
      [47, 2.2, 17], [45, 1.8, 13], [42, 1.3, 14], [38, 1.1, 18],
      [32, 1.0, 18], [24, 0.9, 15], [15, 0.8, 13], [10, 0.7, 9],
      [10, 0.6, 4], [13, 0.5, 0], [20, 0.4, -2], [28, 0.3, -4],
      [34, 0.2, -6], [36, 0.1, -10], [35, 0.0, -14], [40, 0.0, -17],
      [44, 0.0, -20], [45, 0.0, -24], [40, 0.0, -28], [35, 0.0, -30],
      [30, 0.0, -29], [25, 0.0, -26], [20, 0.0, -21], [16, 0.0, -15],
      [12, 0.0, -9], [7, 0.0, -6], [1, 0.0, -5], [-5, 0.0, -5],
      [-11, 0.0, -8], [-18, 0.0, -10], [-24, 0.0, -9], [-27, 0.0, -12],
      [-31, 0.0, -15], [-38, 0.0, -18], [-44, 0.0, -22],
    ],
  },
  british: {
    id: 'british',
    name: 'British Apex',
    inspiration: 'Silverstone-inspired',
    lengthKm: 5.891,
    corners: 18,
    character: 'Fast sweepers · sharp direction changes',
    pace: 0.096,
    weather: { airTemp: 18, trackTemp: 26, humidity: 64, windKph: 21, windDirection: 'W' },
    points: [
      [10, 0, -25], [20, 0, -29], [27, 0, -28], [30, 0, -23],
      [27, 0, -18], [34, 0, -14], [43, 0, -9], [47, 0, -3],
      [46, 0, 3], [40, 0, 7], [30, 0, 10], [20, 0, 13],
      [10, 0, 16], [5, 0, 21], [0, 0, 24], [-5, 0, 22],
      [-8, 0, 18], [-15, 0, 18], [-25, 0, 16], [-35, 0, 14],
      [-43, 0, 10], [-47, 0, 4], [-46, 0, -4], [-45, 0, -13],
      [-42, 0, -19], [-34, 0, -22], [-27, 0, -24], [-23, 0, -21],
      [-24, 0, -17], [-30, 0, -15], [-34, 0, -11], [-33, 0, -6],
      [-28, 0, -2], [-21, 0, 0], [-16, 0, 4], [-12, 0, 7],
      [-7, 0, 7], [-4, 0, 4], [-5, 0, 0], [-1, 0, -4],
      [1, 0, -10], [2, 0, -16], [5, 0, -21],
    ],
  },
  catalunya: {
    id: 'catalunya',
    name: 'Catalunya Lab',
    inspiration: 'Barcelona-inspired',
    lengthKm: 4.657,
    corners: 14,
    character: 'Long straight · mixed technical sectors',
    pace: 0.092,
    weather: { airTemp: 27, trackTemp: 39, humidity: 48, windKph: 11, windDirection: 'SE' },
    points: [
      [-29, 0, -20], [-16, 0, -20], [4, 0, -20], [23, 0, -20],
      [37, 0, -20], [45, 0, -17], [48, 0, -11], [48, 0, -3],
      [45, 0, 6], [40, 0, 13], [34, 0, 18], [28, 0, 19],
      [25, 0, 16], [27, 0, 12], [34, 0, 10], [38, 0, 5],
      [35, 0, 0], [27, 0, 2], [18, 0, 7], [8, 0, 13],
      [1, 0, 18], [-5, 0, 19], [-10, 0, 15], [-15, 0, 8],
      [-20, 0, 1], [-27, 0, 0], [-34, 0, 4], [-41, 0, 9],
      [-47, 0, 8], [-49, 0, 2], [-47, 0, -4], [-41, 0, -8],
      [-34, 0, -7], [-25, 0, -7], [-20, 0, -9], [-18, 0, -13],
      [-20, 0, -17], [-27, 0, -19],
    ],
  },
}

export function createTrackCurve(circuit: CircuitId): THREE.CatmullRomCurve3 {
  const points = trackProfiles[circuit].points.map(
    ([x, y, z]) => new THREE.Vector3(x * 1.35, y, z * 1.35),
  )
  return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5)
}
