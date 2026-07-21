import { useMemo } from 'react'
import { trackProfiles } from '../game/tracks'
import type { CircuitId } from '../game/types'

export function CircuitMap({
  circuit,
  progress,
  compact = false,
}: {
  circuit: CircuitId
  progress?: number
  compact?: boolean
}) {
  const map = useMemo(() => {
    const source = trackProfiles[circuit].points
    const xs = source.map(([x]) => x)
    const zs = source.map(([, , z]) => z)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minZ = Math.min(...zs)
    const maxZ = Math.max(...zs)
    const width = 220
    const height = 116
    const padding = 9
    const scale = Math.min(
      (width - padding * 2) / (maxX - minX),
      (height - padding * 2) / (maxZ - minZ),
    )
    const normalized = source.map(([x, , z]) => ({
      x: padding + (x - minX) * scale,
      y: height - padding - (z - minZ) * scale,
    }))
    const closed = [...normalized, normalized[0]]
    return {
      width,
      height,
      points: closed.map((point) => point.x + ',' + point.y).join(' '),
      marker: normalized[Math.floor(((progress || 0) % 1) * normalized.length)],
    }
  }, [circuit, progress])

  return (
    <div className={'circuit-map' + (compact ? ' compact' : '')}>
      <svg viewBox={'0 0 ' + map.width + ' ' + map.height} role="img" aria-label={trackProfiles[circuit].name + ' circuit map'}>
        <polyline className="circuit-map-shadow" points={map.points} />
        <polyline className="circuit-map-line" points={map.points} />
        {progress !== undefined && <circle cx={map.marker.x} cy={map.marker.y} r="4.5" />}
      </svg>
      <div>
        <strong>{trackProfiles[circuit].name}</strong>
        <span>{trackProfiles[circuit].inspiration} · {trackProfiles[circuit].lengthKm.toFixed(1)} km</span>
      </div>
    </div>
  )
}

