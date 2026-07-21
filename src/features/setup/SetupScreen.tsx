import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { CircuitMap } from '../../components/CircuitMap'
import { botPresetLabels, createBotGrid } from '../../game/config'
import { formatSeconds, predictIncidentRisk, predictLapSeconds } from '../../game/simulation'
import type {
  AeroBalance,
  BotPreset,
  CircuitId,
  Difficulty,
  DriverPriority,
  FuelStrategy,
  GameMode,
  PitPolicy,
  RaceConfig,
  RunRecord,
  RunType,
  ScannerFocus,
  TyreCompound,
} from '../../game/types'
import { createTrackCurve, trackProfiles } from '../../game/tracks'
import { tyreOptions, tyreProfiles } from '../../game/tyres'
import { AISystemVisual } from '../../components/AISystemVisual'

export function SetupScreen({
  config,
  principalName,
  lastRun,
  onChange,
  onStart,
  onTutorial,
}: {
  config: RaceConfig
  principalName: string
  lastRun?: RunRecord
  onChange: (config: RaceConfig) => void
  onStart: () => void
  onTutorial: () => void
}) {
  const bots = useMemo(() => createBotGrid(config.botPreset), [config.botPreset])
  const update = <Key extends keyof RaceConfig>(key: Key, value: RaceConfig[Key]) =>
    onChange({ ...config, [key]: value })

  return (
    <main className="setup-shell page-transition">
      <header className="brand-bar">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div><p className="eyebrow">Autonomous race lab · Scenario 01</p><h1>NEURAL APEX</h1></div>
        <div className="setup-identity"><span>TEAM PRINCIPAL</span><strong>{principalName}</strong><button onClick={onTutorial}>How to play</button></div>
      </header>

      <section className="setup-grid">
        <div className="briefing-column">
          <p className="section-label">Sudden rain · {trackProfiles[config.circuit].name}</p>
          <h2>You run the pit wall.<br />The cars run themselves.</h2>
          <p className="lede">
            Build an autonomous race plan, launch it, inspect the evidence, then change one variable and run again.
          </p>

          <div className="mode-switch" aria-label="Learning mode">
            {([
              ['guided', 'Guided'],
              ['quick', 'Quick start'],
              ['free', 'Free lab'],
            ] as [GameMode, string][]).map(([value, label]) => (
              <button className={config.mode === value ? 'active' : ''} key={value} onClick={() => update('mode', value)}>
                {label}
              </button>
            ))}
          </div>

          {lastRun && (
            <div className="previous-run">
              <span>LAST RUN · #{lastRun.id}</span>
              <strong>{formatSeconds(lastRun.totalSeconds)}</strong>
              <small>P{lastRun.position} · {lastRun.config.tyre} tyres · {lastRun.decision}</small>
            </div>
          )}

          <div className="weather-tape">
            <span>START</span><strong>Dry · {trackProfiles[config.circuit].weather.airTemp}°C air</strong><span className="weather-arrow">→</span>
            <span>LAP 2</span><strong className="rain-text">68% rain</strong><small>{trackProfiles[config.circuit].weather.humidity}% humidity · MED</small>
          </div>

          <section className="preflight-ai" aria-label="AI crew preflight briefing">
            <article className="ml"><b>ML</b><AISystemVisual system="ML" active /><div className="preflight-copy"><strong>PREDICTOR</strong><span>READS · Past runs + setup</span><p>Forecasts {formatSeconds(predictLapSeconds(config))} lap, 68% rain probability, and fuel/tyre risk.</p></div><em className="preflight-status">MED CONFIDENCE</em></article>
            <article className="dl"><b>DL</b><AISystemVisual system="DL" /><div className="preflight-copy"><strong>PATTERN SCANNER</strong><span>READS · Live {config.scannerFocus} signals</span><p>Will detect track state, tyre heat, grip loss, and complex telemetry changes.</p></div><em className="preflight-status">STANDBY</em></article>
            <article className="rl"><b>RL</b><AISystemVisual system="RL" /><div className="preflight-copy"><strong>ADAPTIVE DRIVER</strong><span>READS · Actions + consequences</span><p>Will adjust line, braking, and pace to prioritise {config.priority}.</p></div><em className="preflight-status">POLICY READY</em></article>
          </section>

          <div className="configuration-grid">
            <div className="configuration-column">
              <ChoiceGroup<CircuitId> label="Circuit" value={config.circuit} options={[
                ['ardennes', 'Ardennes Rise'], ['british', 'British Apex'], ['catalunya', 'Catalunya Lab'],
              ]} onChange={(value) => update('circuit', value)} />
              <LapSelector value={config.laps} onChange={(value) => update('laps', value)} />
              <ChoiceGroup<FuelStrategy> label="Fuel load" value={config.fuel} options={[
                ['light', 'Light'], ['balanced', 'Balanced'], ['safe', 'Safe'],
              ]} onChange={(value) => update('fuel', value)} />
              <ChoiceGroup<PitPolicy> label="Weather policy" value={config.pitPolicy} options={[
                ['forecast', 'Trust forecast'], ['reactive', 'Wait for grip'], ['track-position', 'Protect position'],
              ]} onChange={(value) => update('pitPolicy', value)} />
            </div>
            <div className="configuration-column">
              <ChoiceGroup<RunType> label="Session" value={config.runType} options={[
                ['test', 'Test run'], ['qualifying', 'Qualifying'], ['race', 'Race'],
              ]} onChange={(value) => update('runType', value)} />
              <ChoiceGroup<TyreCompound> label="Starting tyre" value={config.tyre} options={tyreOptions} onChange={(value) => update('tyre', value)} />
              <ChoiceGroup<AeroBalance> label="Aero balance" value={config.aero} options={[
                ['speed', 'Top speed'], ['balanced', 'Balanced'], ['grip', 'Grip'],
              ]} onChange={(value) => update('aero', value)} />
              <ChoiceGroup<DriverPriority> label="Adaptive priority" value={config.priority} options={[
                ['finish', 'Finish safely'], ['tyres', 'Protect tyres'], ['winning', 'Chase win'],
              ]} onChange={(value) => update('priority', value)} />
            </div>
          </div>
        </div>

        <aside className="signal-board">
          <div className="prediction-card">
            <p className="section-label">Predictor model · Before launch</p>
            <CircuitMap circuit={config.circuit} />
            <div><span>Circuit</span><strong>{trackProfiles[config.circuit].inspiration}</strong></div>
            <div><span>Profile</span><strong>{trackProfiles[config.circuit].lengthKm.toFixed(1)} KM · {trackProfiles[config.circuit].corners} turns</strong></div>
            <div><span>Expected lap</span><strong>{formatSeconds(predictLapSeconds(config))}</strong></div>
            <div><span>Rain probability</span><strong>68% · MED</strong></div>
            <div><span>Conditions</span><strong>{trackProfiles[config.circuit].weather.trackTemp}° TRACK · {trackProfiles[config.circuit].weather.windKph} KM/H WIND</strong></div>
            <div><span>Tyre class</span><strong style={{ color: tyreProfiles[config.tyre].color }}>{tyreProfiles[config.tyre].name}</strong></div>
            <div><span>Finish confidence</span><strong>{config.fuel === 'light' ? '74%' : '91%'}</strong></div>
            <div><span>Base incident risk</span><strong>{predictIncidentRisk(config)}% · setup dependent</strong></div>
          </div>

          <div className="setup-controls compact">
            <ChoiceGroup<Difficulty> label="Opponent model" value={config.difficulty} options={[
              ['rookie', 'Rookie'], ['professional', 'Pro'], ['adaptive', 'Adaptive'],
            ]} onChange={(value) => update('difficulty', value)} />
            <ChoiceGroup<ScannerFocus> label="Scanner allocation" value={config.scannerFocus} options={[
              ['vision', 'Vision'], ['balanced', 'Balanced'], ['telemetry', 'Telemetry'],
            ]} onChange={(value) => update('scannerFocus', value)} />
          </div>

          <div className="bot-panel">
            <div className="panel-heading"><div><p className="section-label">Autonomous grid</p><h3>One-click rivals</h3></div><span>{bots.length + 1} cars</span></div>
            <div className="preset-grid">
              {(Object.keys(botPresetLabels) as BotPreset[]).map((preset) => (
                <button key={preset} className={config.botPreset === preset ? 'selected' : ''} onClick={() => update('botPreset', preset)}>
                  <strong>{botPresetLabels[preset].title}</strong><small>{botPresetLabels[preset].detail}</small>
                </button>
              ))}
            </div>
            <div className="grid-preview" aria-label="Generated race grid">
              <div className="car-chip player-chip"><i style={{ background: '#ff633f' }} />YOUR AGENT</div>
              {bots.map((bot) => <div className="car-chip" key={bot.id}><i style={{ background: bot.color }} />{bot.name}{bot.adaptive && <span>A</span>}</div>)}
            </div>
          </div>

          <p className="track-character">{trackProfiles[config.circuit].character}</p>
          <button className="start-race" onClick={onStart}><span>Launch autonomous {config.runType}</span><b>↗</b></button>
          <p className="simulation-note">No driving controls · Strategy decisions only</p>
        </aside>
      </section>
    </main>
  )
}

function LapSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <fieldset className="choice-group lap-selector">
      <legend>Run length</legend>
      <div>
        <input aria-label="Number of laps" type="range" min="1" max="8" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{value} {value === 1 ? 'LAP' : 'LAPS'}</strong>
      </div>
      <small>1–8 lap strategy experiment</small>
    </fieldset>
  )
}

function ChoiceGroup<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Value
  options: [Value, string][]
  onChange: (value: Value) => void
}) {
  const help = setupHelp[label]
  return (
    <fieldset className="choice-group">
      <legend><span>{label}</span>{help && <span className="help-hint" tabIndex={0}>?<i>{help}</i></span>}</legend>
      <div>
        {options.map(([option, text]) => (
          <button type="button" key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>
            <OptionVisual label={label} value={option} />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function OptionVisual({ label, value }: { label: string; value: string }) {
  if (label === 'Circuit') {
    const curve = createTrackCurve(value as CircuitId)
    const points = Array.from({ length: 80 }, (_, index) => {
      const point = curve.getPointAt(index / 80)
      return point.x + ',' + -point.z
    }).join(' ')
    return <svg className="option-circuit" viewBox="-70 -48 140 96" aria-hidden="true"><polyline points={points} /></svg>
  }
  if (label === 'Starting tyre') {
    const profile = tyreProfiles[value as TyreCompound]
    return <i className="option-tyre" style={{ '--option-color': profile.color } as CSSProperties}>{profile.code}</i>
  }
  if (label === 'Session') return <i className={'option-session ' + value}><span /><span /><span /></i>
  if (label === 'Fuel load') return <i className={'option-fuel ' + value}><span /></i>
  if (label === 'Aero balance') return <i className={'option-aero ' + value}><span /><span /></i>
  if (label === 'Weather policy') return <i className={'option-weather ' + value}>☁<span>↗</span></i>
  if (label === 'Adaptive priority') return <i className={'option-priority ' + value}><span /><span /><span /></i>
  if (label === 'Opponent model') return <i className={'option-opponent ' + value}>◆</i>
  if (label === 'Scanner allocation') return <i className={'option-scanner ' + value}><span /></i>
  return null
}

const setupHelp: Record<string, string> = {
  Circuit: 'Each layout changes lap length, corner type, base pace, temperature, wind, and how quickly weather becomes costly.',
  Session: 'Practice and qualifying show best lap times. Race mode shows the live interval to the car ahead.',
  'Starting tyre': 'C1 is hardest and most durable; C5 is softest and fastest. Intermediates suit light rain; full wets suit heavy rain.',
  'Fuel load': 'Less fuel helps pace but leaves less margin. A safe load costs speed but lowers the risk of running short.',
  'Aero balance': 'Top-speed trim helps straights but reacts more to wind. Grip trim protects cornering and wet-weather confidence.',
  'Weather policy': 'Controls whether the team trusts the forecast, waits for live grip evidence, or protects track position.',
  'Adaptive priority': 'Tells the autonomous driver whether to protect the finish, tyres, or outright position when adapting.',
  'Opponent model': 'Changes rival pace and how aggressively they respond after the weather shifts.',
  'Scanner allocation': 'Changes what the pattern scanner watches most closely: visuals, telemetry, or a balanced mix.',
}
