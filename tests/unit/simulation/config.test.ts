import { describe, expect, it } from 'vitest'

import { botPresetLabels, createBotGrid, defaultConfig } from '../../../src/simulation/config'
import type { BotPreset } from '../../../src/simulation/types'

const presets: BotPreset[] = ['rookie', 'balanced', 'competitive', 'adaptive']

describe('autonomous grid configuration', () => {
  it('creates the documented number of initialized rivals for every one-click preset', () => {
    const expectedCounts: Record<BotPreset, number> = { rookie: 3, balanced: 4, competitive: 5, adaptive: 3 }
    for (const preset of presets) {
      const grid = createBotGrid(preset)
      expect(grid).toHaveLength(expectedCounts[preset])
      expect(grid.every((racer) => racer.speed === 0 && !racer.inPit && racer.damage === 'none')).toBe(true)
      expect(new Set(grid.map((racer) => racer.id)).size).toBe(grid.length)
      expect(botPresetLabels[preset].detail).toContain(String(expectedCounts[preset]))
    }
  })

  it('returns fresh racer state rather than sharing mutable preset objects', () => {
    const first = createBotGrid('balanced')
    first[0].speed = 99
    expect(createBotGrid('balanced')[0].speed).toBe(0)
    expect(defaultConfig.botPreset).toBe('balanced')
  })
})
