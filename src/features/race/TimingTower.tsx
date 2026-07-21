import { formatSeconds, formatSessionClock } from '../../game/simulation'
import { tyreProfiles } from '../../game/tyres'
import type { RaceConfig, RaceSnapshot, RacerState } from '../../game/types'
import type { CSSProperties } from 'react'

export function TimingTower({ snapshot, config, principalName }: { snapshot: RaceSnapshot; config: RaceConfig; principalName: string }) {
  const isRace = config.runType === 'race'
  const racers = [...snapshot.racers].sort((a, b) => {
    if (isRace) return b.progress - a.progress
    if (a.bestLapSeconds === null) return 1
    if (b.bestLapSeconds === null) return -1
    return a.bestLapSeconds - b.bestLapSeconds
  })
  const leader = racers[0]
  const sessionLabel = config.runType === 'test' ? 'FP' : config.runType === 'qualifying' ? 'Q1' : 'RACE'

  return (
    <aside className="timing-tower" aria-label="Live timing tower">
      <header>
        <div><span>{principalName.toUpperCase()} · LIVE</span><strong>{sessionLabel}</strong></div>
        <b>{isRace ? 'LAP ' + snapshot.lap + ' / ' + snapshot.totalLaps : formatSessionClock(snapshot.sessionDuration - snapshot.elapsed)}</b>
      </header>
      <div className="tower-weather">
        <WeatherMetric label="AIR" value={snapshot.airTemp.toFixed(1) + '°'} />
        <WeatherMetric label="TRACK" value={snapshot.trackTemp.toFixed(1) + '°'} />
        <WeatherMetric label="HUM" value={snapshot.humidity + '%'} />
        <WeatherMetric label="WIND" value={snapshot.windKph + ' ' + snapshot.windDirection} />
      </div>
      <div className="tower-column-head"><span>POS</span><span>DRIVER</span><span>{isRace ? 'INTERVAL' : 'BEST'}</span><span>TYRE</span></div>
      <ol>
        {racers.map((racer, index) => (
          <li key={racer.id} className={racer.id === 'player' ? 'player' : ''}>
            <b>{index + 1}</b>
            <i style={{ background: racer.color }} />
            <span>{driverCode(racer)}<small>{racer.id === 'player' ? 'TEAM' : racer.adaptive ? 'ADAPT' : 'AUTO'}</small></span>
            <strong>{timingValue(racer, leader, isRace)}</strong>
            <em style={{ '--tyre-color': tyreProfiles[racer.tyre].color } as CSSProperties}>{tyreProfiles[racer.tyre].code}</em>
          </li>
        ))}
      </ol>
      <footer><span className={snapshot.rain > 0.05 ? 'weather-live wet' : 'weather-live'} />{snapshot.rain > 0.05 ? 'RAIN ' + Math.round(snapshot.rain * 100) + '%' : 'TRACK DRY'}{snapshot.penaltySeconds > 0 && <em>+{snapshot.penaltySeconds}s PEN</em>}<b>{snapshot.position === 1 ? 'LEADING' : 'P' + snapshot.position}</b></footer>
    </aside>
  )
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function driverCode(racer: RacerState): string {
  if (racer.id === 'player') return 'NAX'
  return racer.name.split(' ').map((word) => word[0]).join('').slice(0, 3).toUpperCase()
}

function timingValue(racer: RacerState, leader: RacerState, isRace: boolean): string {
  if (racer.retired) return 'DNF'
  if (racer.finished) return 'FINISHED'
  if (racer.inPit) return 'IN PIT'
  if (!isRace) return racer.bestLapSeconds === null ? 'OUT LAP' : formatSeconds(racer.bestLapSeconds)
  if (racer.id === leader.id) return 'INTERVAL'
  const pace = Math.max(0.055, leader.speed || racer.speed)
  return '+' + Math.max(0, (leader.progress - racer.progress) / pace).toFixed(1)
}
