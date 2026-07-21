import { lazy, Suspense, useState } from 'react'
import { CircuitMap } from '../../components/CircuitMap'
import { formatSeconds } from '../../game/simulation'
import type { RaceConfig, RaceDecision, RaceSnapshot, StrategyCommand } from '../../game/types'
import { requestConflictExplanation } from '../../services/raceEngineer'
import { SafeRichText } from '../../components/SafeRichText'
import { tyreProfiles } from '../../game/tyres'
import { TimingTower } from './TimingTower'
import { AISystemVisual } from '../../components/AISystemVisual'

const RaceScene = lazy(() =>
  import('../../components/RaceScene').then((module) => ({ default: module.RaceScene })),
)

export function RaceExperience({
  config,
  principalName,
  onFinish,
  onExit,
}: {
  config: RaceConfig
  principalName: string
  onFinish: (race: RaceSnapshot) => void
  onExit: () => void
}) {
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null)
  const [strategy, setStrategy] = useState<StrategyCommand>('balanced')
  const [decision, setDecision] = useState<RaceDecision | null>(null)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [source, setSource] = useState('')
  const [explaining, setExplaining] = useState(false)

  const explain = async () => {
    if (!snapshot) return
    setExplaining(true)
    try {
      const result = await requestConflictExplanation(snapshot, config, decision)
      setExplanation(result.explanation)
      setSource(result.source)
    } catch {
      setExplanation('The Predictor looks ahead, the Scanner reports current evidence, and the Adaptive Driver protects the current race state. Different jobs can produce different advice.')
      setSource('browser-fallback')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <main className="race-shell page-transition">
      <Suspense fallback={<div className="scene-loading">Loading autonomous circuit…</div>}>
        <RaceScene
          config={config}
          strategy={strategy}
          decision={decision}
          paused={paused || decisionOpen}
          onSnapshot={setSnapshot}
          onNeedDecision={() => setDecisionOpen(true)}
          onFinish={onFinish}
        />
      </Suspense>
      {snapshot && <RaceHud snapshot={snapshot} config={config} principalName={principalName} paused={paused} onPause={() => setPaused(true)} />}

      <section className="strategy-console" aria-label="Pit wall strategy commands">
        <div><span>PIT WALL COMMAND</span><strong>{strategy.toUpperCase()}</strong></div>
        {(['push', 'balanced', 'conserve'] as StrategyCommand[]).map((command) => (
          <button key={command} className={strategy === command ? 'active' : ''} onClick={() => setStrategy(command)}>
            {command === 'push' ? 'Push pace' : command === 'conserve' ? 'Conserve tyres' : 'Hold plan'}
          </button>
        ))}
      </section>

      {config.mode === 'guided' && snapshot && !snapshot.scannerAlert && (
        <div className="coach-callout"><span>RACE ENGINEER</span>Your autonomous driver follows the setup. Change only high-level strategy from the pit wall.</div>
      )}

      {decisionOpen && snapshot && (
        <DecisionModal
          snapshot={snapshot}
          explanation={explanation}
          source={source}
          explaining={explaining}
          onExplain={explain}
          onChoose={(choice) => {
            setDecision(choice)
            setDecisionOpen(false)
          }}
        />
      )}

      {paused && (
        <div className="pause-screen">
          <p className="eyebrow">Simulation held</p><h2>Strategy review</h2>
          <button onClick={() => setPaused(false)}>Resume autonomous run</button>
          <button className="quiet-button" onClick={onExit}>Return to setup</button>
        </div>
      )}
    </main>
  )
}

function RaceHud({
  snapshot,
  config,
  principalName,
  paused,
  onPause,
}: {
  snapshot: RaceSnapshot
  config: RaceConfig
  principalName: string
  paused: boolean
  onPause: () => void
}) {
  const latest = snapshot.eventLog.at(-1) || ''
  return (
    <>
      <TimingTower snapshot={snapshot} config={config} principalName={principalName} />
      <div className="race-status">
        <div className="position-block"><span>POS</span><strong>{snapshot.position}</strong><small>/{snapshot.racers.length}</small></div>
        <div className="lap-block"><span>LAP</span><strong>{snapshot.lap}</strong><small>/{snapshot.totalLaps}</small></div>
        <div className="speed-block"><strong>{snapshot.speedKph.toString().padStart(3, '0')}</strong><span>AUTO KM/H</span></div>
        <button className="pause-button" onClick={onPause} disabled={paused} aria-label="Pause simulation">Ⅱ</button>
      </div>
      <div className="lap-meter"><span style={{ width: Math.round(snapshot.lapProgress * 100) + '%' }} /></div>
      <aside className="race-signal-rail">
        <Signal code="ML" role="PREDICTS" title="Predictor" state={'Rain 68% · Expected ' + formatSeconds(snapshot.predictedLapSeconds)} confidence="MED" color="orange" />
        <Signal code="DL" role="DETECTS" title="Pattern Scanner" state={snapshot.scannerAlert ? 'Rear heat · Track ' + snapshot.trackTemp.toFixed(1) + '°' : 'Scanning live telemetry'} confidence={snapshot.scannerAlert ? 'ALERT' : 'LIVE'} color="cyan" />
        <Signal code="RL" role="ADAPTS" title="Adaptive Driver" state={snapshot.adaptiveAlert ? 'Braking point changed after grip loss' : 'Learning from ' + snapshot.strategyCommand + ' command'} confidence={snapshot.adaptiveAlert ? 'CHANGED' : 'READY'} color="violet" />
      </aside>
      <section className="telemetry-stack">
        <CircuitMap circuit={config.circuit} progress={snapshot.lapProgress} compact />
        <Telemetry label="TYRE WEAR" value={snapshot.tyreWear} suffix="%" />
        <Telemetry label="FUEL" value={snapshot.fuelRemaining} suffix="%" />
        <Telemetry label="GRIP" value={snapshot.grip} suffix="%" />
        <Telemetry label="INCIDENT RISK" value={snapshot.incidentRisk} suffix="%" />
        <div className="weather-readout"><span>AIR <b>{snapshot.airTemp.toFixed(1)}°C</b></span><span>TRACK <b>{snapshot.trackTemp.toFixed(1)}°C</b></span><span>HUM <b>{snapshot.humidity}%</b></span><span>WIND <b>{snapshot.windKph} {snapshot.windDirection}</b></span></div>
        <div className="setup-readout"><span>SETUP</span><strong style={{ color: tyreProfiles[snapshot.activeTyre].color }}>{tyreProfiles[snapshot.activeTyre].code} · {config.aero.toUpperCase()} AERO · {snapshot.racers[0].damage.toUpperCase()} DAMAGE</strong></div>
      </section>
      {latest && <div className="event-ticker"><span>LIVE</span>{latest}</div>}
    </>
  )
}

function Telemetry({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div className="telemetry-row"><span>{label}</span><div><i style={{ width: Math.max(2, Math.min(100, value)) + '%' }} /></div><strong>{Math.round(value)}{suffix}</strong></div>
}

function Signal({ code, role, title, state, confidence, color }: { code: string; role: string; title: string; state: string; confidence: string; color: string }) {
  return <div className={'hud-signal ' + color + ' active'}><b>{code}<small>{role}</small></b><AISystemVisual system={code as 'ML' | 'DL' | 'RL'} active={confidence === 'ALERT' || confidence === 'CHANGED'} /><div><strong>{title}</strong><span>{state}</span></div><em>{confidence}</em></div>
}

function DecisionModal({
  snapshot,
  explanation,
  source,
  explaining,
  onExplain,
  onChoose,
}: {
  snapshot: RaceSnapshot
  explanation: string
  source: string
  explaining: boolean
  onExplain: () => void
  onChoose: (decision: RaceDecision) => void
}) {
  return (
    <div className="decision-backdrop">
      <section className="decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="decision-kicker"><span>STRATEGY WINDOW 01</span><b>Simulation paused</b></div>
        <h2 id="decision-title">The systems disagree.<br />You make the call.</h2>
        <div className="conflict-lines">
          <div className="ml"><b>ML</b><AISystemVisual system="ML" active /><p><strong>Predictor</strong>Rain likely before lap two.</p><em>MED</em></div>
          <div className="dl"><b>DL</b><AISystemVisual system="DL" active /><p><strong>Pattern Scanner</strong>Track dry. Rear wear {Math.round(snapshot.tyreWear)}%.</p><em>LIVE</em></div>
          <div className="rl"><b>RL</b><AISystemVisual system="RL" active /><p><strong>Adaptive Driver</strong>Stay out to protect position.</p><em>READY</em></div>
        </div>
        <p className="engineer-line">“We can trust the forecast now, or wait for visible grip loss. Which signal matters most?”</p>
        {explanation && <div className="ai-explanation"><span>Race engineer · {source === 'openai' ? 'GPT-5.6' : 'Local briefing'}</span><SafeRichText text={explanation} /></div>}
        <div className="decision-actions">
          <button className="pit-action intermediate-action" onClick={() => onChoose('pit-intermediate')}><span>Pit for intermediates</span><small>Light rain · flexible grip</small></button>
          <button className="pit-action wet-action" onClick={() => onChoose('pit-wet')}><span>Pit for full wets</span><small>Heavy rain · maximum drainage</small></button>
          <button className="stay-action" onClick={() => onChoose('stay-out')}><span>Stay out</span><small>Protect position · risk grip</small></button>
        </div>
        <button className="explain-action" onClick={onExplain} disabled={explaining}>{explaining ? 'Race engineer is thinking…' : 'Explain why they disagree'}</button>
      </section>
    </div>
  )
}
