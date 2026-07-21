import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createTrackCurve, trackProfiles } from './tracks'
import type { CircuitId } from './types'

type Point2 = { x: number; z: number }

function orientation(a: Point2, b: Point2, c: Point2): number {
  return (b.z - a.z) * (c.x - b.x) - (b.x - a.x) * (c.z - b.z)
}

function intersects(a: Point2, b: Point2, c: Point2, d: Point2): boolean {
  const first = orientation(a, b, c)
  const second = orientation(a, b, d)
  const third = orientation(c, d, a)
  const fourth = orientation(c, d, b)
  return first * second < -1e-7 && third * fourth < -1e-7
}

function findNonAdjacentIntersections(points: Point2[]): string[] {
  const intersections: string[] = []
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length
      const adjacent = first === second || firstNext === second || secondNext === first
      if (!adjacent && intersects(points[first], points[firstNext], points[second], points[secondNext])) {
        intersections.push(first + '-' + firstNext + ' x ' + second + '-' + secondNext)
      }
    }
  }
  return intersections
}

describe('circuit topology', () => {
  const circuits = Object.keys(trackProfiles) as CircuitId[]

  it.each(circuits)('%s has no crossing raw centreline segments', (circuit) => {
    const points = trackProfiles[circuit].points.map(([x, , z]) => ({ x, z }))
    expect(findNonAdjacentIntersections(points)).toEqual([])
  })

  it.each(circuits)('%s spline does not create curve overshoot intersections', (circuit) => {
    const curve = createTrackCurve(circuit)
    const points = Array.from({ length: 240 }, (_, index) => {
      const point = curve.getPointAt(index / 240, new THREE.Vector3())
      return { x: point.x, z: point.z }
    })
    expect(findNonAdjacentIntersections(points)).toEqual([])
  })
})
