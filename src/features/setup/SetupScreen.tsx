import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { CircuitMap } from '../../components/CircuitMap'
import { botPresetLabels, createBotGrid } from '../../game/config'
import { createWeatherForecast, formatSeconds, predictIncidentRisk, predictLapSeconds } from '../../game/simulation'
import type {
  AeroBalance,
  BotPreset,
  CircuitId,
  Difficulty,
  DriverPriority,
  DriverStyle,
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
  onMain,
}: {
  config: RaceConfig
  principalName: string
  lastRun?: RunRecord
  onChange: (config: RaceConfig) => void
  onStart: () => void
  onTutorial: () => void
  onMain: () => void
}) {
  const bots = useMemo(() => createBotGrid(config.botPreset), [config.botPreset])
  const forecast = useMemo(() => createWeatherForecast(config), [config])
  const modeDetail = modeDetails[config.mode]
  const wetTyreOnDryStart = (config.tyre === 'intermediate' || config.tyre === 'full-wet') && forecast.rainProbability < 60
  const paceIntent = config.driverStyle === 'aggressive' || config.priority === 'winning'
    ? 'Attack-biased'
    : config.driverStyle === 'cautious' || config.priority === 'tyres'
      ? 'Conservative'
      : 'Balanced'
  const update = <Key extends keyof RaceConfig>(key: Key, value: RaceConfig[Key]) =>
    onChange({ ...config, [key]: value })
  const selectMode = (mode: GameMode) => {
    if (mode === 'quick') {
      onChange({ ...config, mode, laps: 8, difficulty: 'professional', scannerFocus: 'balanced', priority: 'finish', driverStyle: 'balanced', botPreset: 'balanced' })
      return
    }
    onChange({ ...config, mode })
  }

  return (
    <main className="setup-shell page-transition">
      <header className="brand-bar">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div><p className="eyebrow">Autonomous race lab · Scenario 01</p><h1>NEURAL APEX</h1></div>
        <div className="setup-identity"><span>TEAM PRINCIPAL</span><strong>{principalName}</strong><div><button onClick={onMain}>← Main</button><button onClick={onTutorial}>How to play</button></div></div>
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
              <button className={config.mode === value ? 'active' : ''} key={value} onClick={() => selectMode(value)}>
                {label}
              </button>
            ))}
          </div>
          <div className={'mode-explanation ' + config.mode}>
            <span>{modeDetail.kicker}</span>
            <div><strong>{modeDetail.title}</strong><p>{modeDetail.detail}</p></div>
            <small>{modeDetail.prompt}</small>
          </div>

          {lastRun && (
            <div className="previous-run">
              <span>LAST RUN · #{lastRun.id}</span>
              <strong>{formatSeconds(lastRun.totalSeconds)}</strong>
              <small>P{lastRun.position} · {lastRun.config.tyre} tyres · {lastRun.decision}</small>
            </div>
          )}

          <div className="weather-tape" style={{ '--rain-chance': forecast.rainProbability + '%' } as CSSProperties}>
            <div className="weather-stage dry"><i>☀</i><span>START CONDITION</span><strong>Dry · {forecast.airTemp.toFixed(1)}°C air</strong><small>{forecast.trackTemp.toFixed(1)}°C track</small></div>
            <div className="weather-flow"><span>ML FORECAST · #{forecast.seed}</span><div><i /></div><b>→</b><small>Reproducible scenario</small></div>
            <div className="weather-stage wet"><i>☂</i><span>{forecastWindowLabel(forecast.rainOnsetProgress)}</span><strong>{forecast.rainProbability}% rain</strong><small>{Math.round(forecast.rainPeak * 100)}% forecast peak</small></div>
            <div className="weather-details"><span>HUMIDITY <b>{forecast.humidity}%</b></span><span>WIND <b>{forecast.windKph} {forecast.windDirection}</b></span><span>CONFIDENCE <b>MED</b></span></div>
            <button type="button" className="weather-refresh" onClick={() => update('weatherSeed', Math.floor(1000 + Math.random() * 9000))}>↻ New forecast</button>
          </div>

          <section className="preflight-ai" aria-label="AI crew preflight briefing">
            <article className="ml"><b>ML</b><AISystemVisual system="ML" active metric={forecast.rainProbability + '%'} /><div className="preflight-copy"><strong>PREDICTOR</strong><span>READS · Past runs + setup</span><p>Forecasts {formatSeconds(predictLapSeconds(config))} lap, {forecast.rainProbability}% rain probability, and fuel/tyre risk.</p></div><em className="preflight-status">MED CONFIDENCE</em></article>
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
              <ChoiceGroup<DriverStyle> label="Driver style" value={config.driverStyle} options={[
                ['cautious', 'Cautious'], ['balanced', 'Balanced'], ['aggressive', 'Aggressive'],
              ]} onChange={(value) => update('driverStyle', value)} />
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
            <div><span>Rain probability</span><strong>{forecast.rainProbability}% · MED · #{forecast.seed}</strong></div>
            <div><span>Conditions</span><strong>{forecast.trackTemp.toFixed(1)}° TRACK · {forecast.windKph} KM/H {forecast.windDirection}</strong></div>
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

          <section className="setup-impact-card" aria-label="Current setup impact">
            <div className="panel-heading"><div><p className="section-label">Calculated setup impact</p><h3>{paceIntent} run plan</h3></div><span>LIVE</span></div>
            <div className="impact-grid">
              <div><span>TYRE</span><strong>{tyreProfiles[config.tyre].code}</strong><small>{wetTyreOnDryStart ? 'Dry-start pace penalty' : 'Matched to current plan'}</small></div>
              <div><span>DRIVER</span><strong>{config.driverStyle}</strong><small>{config.driverStyle === 'aggressive' ? 'Later braking · more risk' : config.driverStyle === 'cautious' ? 'Earlier braking · less risk' : 'Adaptive compromise'}</small></div>
              <div><span>AERO</span><strong>{config.aero}</strong><small>{config.aero === 'speed' ? 'Higher straight speed' : config.aero === 'grip' ? 'More corner grip' : 'Mixed circuit balance'}</small></div>
              <div><span>OBJECTIVE</span><strong>{config.priority}</strong><small>{config.priority === 'winning' ? 'Pace over margin' : config.priority === 'tyres' ? 'Wear over lap time' : 'Finish confidence first'}</small></div>
            </div>
            {wetTyreOnDryStart && <p className="setup-warning">Full-wet-family tyres are intentionally slower until enough rain reaches the circuit.</p>}
          </section>

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
        <input aria-label="Number of laps" type="range" min="1" max="32" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{value} {value === 1 ? 'LAP' : 'LAPS'}</strong>
      </div>
      <div className="lap-presets" aria-label="Common run lengths">{[8, 16, 24, 32].map((laps) => <button type="button" key={laps} className={value === laps ? 'active' : ''} onClick={() => onChange(laps)}>{laps}</button>)}</div>
      <small>1–32 laps · longer runs allow more event-driven strategy windows</small>
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
  if (label === 'Driver style') return <i className={'option-driver ' + value}><span /><span /><span /></i>
  if (label === 'Opponent model') return <i className={'option-opponent ' + value}><span /><span /><span /></i>
  if (label === 'Scanner allocation') return <i className={'option-scanner ' + value}><span /><span /><span /></i>
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
  'Driver style': 'Controls braking margin and overtaking commitment. Aggressive is faster but burns more fuel and tyres and raises contact and track-limit risk.',
  'Opponent model': 'Changes rival pace and how aggressively they respond after the weather shifts.',
  'Scanner allocation': 'Changes what the pattern scanner watches most closely: visuals, telemetry, or a balanced mix.',
}

const modeDetails: Record<GameMode, { kicker: string; title: string; detail: string; prompt: string }> = {
  guided: { kicker: 'COACHED', title: 'Learn each system while you race', detail: 'Context prompts explain the ML forecast, DL detections, RL adaptations, and every strategy window.', prompt: 'Best first run' },
  quick: { kicker: 'CURATED', title: 'Load a balanced eight-lap preset', detail: 'Selects Pro opponents, balanced scanner and grid, finish priority, and eight laps. You can still fine-tune before launch.', prompt: 'One-click baseline' },
  free: { kicker: 'OPEN LAB', title: 'Experiment without coaching prompts', detail: 'Tune every setup variable, read the instruments yourself, and compare seeded scenarios with minimal interruption.', prompt: 'Best for testing ideas' },
}

function forecastWindowLabel(progress: number): string {
  const lap = Math.floor(progress) + 1
  const phase = progress % 1
  return 'LAP ' + lap + (phase < .34 ? ' · EARLY' : phase < .68 ? ' · MID' : ' · LATE')
}
