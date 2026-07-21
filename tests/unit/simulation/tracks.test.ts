import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { cornerSeverityAt, createPitLaneLayout, createTrackCurve, racingLineOffsetAt, trackProfiles } from '../../../src/simulation/tracks'
import type { CircuitId } from '../../../src/simulation/types'

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

function findNonAdjacentIntersections(points: Point2[], neighborWindow = 1): string[] {
  const intersections: string[] = []
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length
      const adjacent = first === second || firstNext === second || secondNext === first
      const directGap = Math.abs(first - second)
      const circularGap = Math.min(directGap, points.length - directGap)
      if (!adjacent && circularGap > neighborWindow && intersects(points[first], points[firstNext], points[second], points[secondNext])) {
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

  it.each(circuits)('%s road edges remain non-crossing at full curb width', (circuit) => {
    const curve = createTrackCurve(circuit)
    for (const offset of [-4, 4]) {
      const points = Array.from({ length: 240 }, (_, index) => {
        const t = index / 240
        const point = curve.getPointAt(t, new THREE.Vector3())
        const tangent = curve.getTangentAt(t, new THREE.Vector3()).normalize()
        return { x: point.x - tangent.z * offset, z: point.z + tangent.x * offset }
      })
      // Twelve samples cover one local corner at this resolution; anything farther apart is a distinct road section.
      expect(findNonAdjacentIntersections(points, 12)).toEqual([])
    }
  })

  it.each(circuits)('%s exposes distinct straight and sharp-corner severity', (circuit) => {
    const severities = Array.from({ length: 160 }, (_, index) => cornerSeverityAt(circuit, index / 160))
    expect(Math.max(...severities)).toBeGreaterThan(0.75)
    expect(Math.min(...severities)).toBeLessThan(0.2)
  })

  it.each(circuits)('%s reserves hairpin braking for a small part of the lap', (circuit) => {
    const severities = Array.from({ length: 1000 }, (_, index) => cornerSeverityAt(circuit, index / 1000)).sort((a, b) => a - b)
    const hairpinShare = severities.filter((severity) => severity > 0.82).length / severities.length
    const median = severities[Math.floor(severities.length / 2)]
    expect(hairpinShare).toBeGreaterThan(0.04)
    expect(hairpinShare).toBeLessThan(0.16)
    expect(median).toBeLessThan(0.35)
  })

  it.each(circuits)('%s racing line leaves centre and remains inside the usable lane', (circuit) => {
    const offsets = Array.from({ length: 240 }, (_, index) => racingLineOffsetAt(circuit, index / 240))
    expect(Math.max(...offsets.map(Math.abs))).toBeGreaterThan(0.4)
    expect(Math.max(...offsets.map(Math.abs))).toBeLessThanOrEqual(0.84)
  })

  it.each(circuits)('%s pit lane stays on the circuit exterior with a real service-lane gap', (circuit) => {
    const main = createTrackCurve(circuit)
    const pit = createPitLaneLayout(main).curve
    expect(pit.getPointAt(0).distanceTo(main.getPointAt(.9))).toBeLessThan(.25)
    expect(pit.getPointAt(1).distanceTo(main.getPointAt(.1))).toBeLessThan(.4)
    const middle = pit.getPointAt(.5)
    const nearestMainDistance = Math.min(...main.getSpacedPoints(300).map((point) => point.distanceTo(middle)))
    expect(nearestMainDistance).toBeGreaterThan(5.4)
    expect(nearestMainDistance).toBeLessThan(13)
  })

  it.each(circuits)('%s pit lane has no non-adjacent self-crossing', (circuit) => {
    const pit = createPitLaneLayout(createTrackCurve(circuit)).curve
    const points = pit.getSpacedPoints(180).map((point) => ({ x: point.x, z: point.z }))
    const crossings: string[] = []
    for (let first = 0; first < points.length - 1; first += 1) {
      for (let second = first + 8; second < points.length - 1; second += 1) {
        if (intersects(points[first], points[first + 1], points[second], points[second + 1])) crossings.push(first + 'x' + second)
      }
    }
    expect(crossings).toEqual([])
  })

  it.each(circuits)('%s pit service section does not cross the main centreline', (circuit) => {
    const main = createTrackCurve(circuit).getSpacedPoints(240).map((point) => ({ x: point.x, z: point.z }))
    const pit = createPitLaneLayout(createTrackCurve(circuit)).curve.getSpacedPoints(180).map((point) => ({ x: point.x, z: point.z }))
    const crossings: string[] = []
    for (let pitIndex = 18; pitIndex < pit.length - 19; pitIndex += 1) {
      for (let mainIndex = 0; mainIndex < main.length - 1; mainIndex += 1) {
        if (intersects(pit[pitIndex], pit[pitIndex + 1], main[mainIndex], main[mainIndex + 1])) crossings.push(pitIndex + 'x' + mainIndex)
      }
    }
    expect(crossings).toEqual([])
  })
})
