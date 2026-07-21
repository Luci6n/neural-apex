import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CircuitMap } from '../../shared/ui/CircuitMap'
import { evaluateSystemAdvice, formatSeconds, isWetTyre, tyreOptions, tyreProfiles } from '../../simulation'
import type { RaceConfig, RaceDecision, RaceSnapshot, StrategyCommand, TyreCompound } from '../../simulation'
import { requestConflictExplanation } from '../../services/race-engineer/client'
import type { ExplanationResponse } from '../../services/race-engineer/client'
import { SafeRichText } from '../../shared/ui/SafeRichText'
import { TimingTower } from './TimingTower'
import { AISystemVisual } from '../../shared/ui/AISystemVisual'

const RaceScene = lazy(() =>
  import('./RaceScene').then((module) => ({ default: module.RaceScene })),
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
  const [pitMenuOpen, setPitMenuOpen] = useState(false)
  const [pitCommand, setPitCommand] = useState<{ id: number; tyre: TyreCompound | null }>({ id: 0, tyre: null })
  const [explanation, setExplanation] = useState('')
  const [source, setSource] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [verdict, setVerdict] = useState<ExplanationResponse | null>(null)
  const requestedWindow = useRef(false)
  const manualRecommendation: TyreCompound = !snapshot ? config.tyre : snapshot.rain >= 0.5 ? 'full-wet' : snapshot.rain >= 0.1 ? 'intermediate' : snapshot.trackTemp >= 35 ? 'c2' : snapshot.trackTemp <= 24 ? 'c4' : 'c3'
  const manualVotes = snapshot ? Object.values(evaluateSystemAdvice(snapshot, config)).filter((value) => value === 'pit').length : 0

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [])

  const explain = async () => {
    if (!snapshot) return
    setExplaining(true)
    setExplanation('')
    try {
      const result = await requestConflictExplanation(snapshot, config, decision, (delta) => setExplanation((current) => current + delta))
      setExplanation(result.explanation)
      setSource(result.source)
      setVerdict(result)
    } catch {
      const local = evaluateSystemAdvice(snapshot, config)
      const fallback: ExplanationResponse = {
        ...local,
        source: 'browser-fallback',
        engineerSummary: 'The Predictor looks ahead, the Scanner reports current evidence, and the Adaptive Driver responds to the configured objective.',
        tradeoff: 'Agreement is not certainty, while disagreement means the evidence supports different risks. The final call remains yours.',
        explanation: 'The Predictor looks ahead, the Scanner reports current evidence, and the Adaptive Driver responds to the configured objective.\n\nAgreement is not certainty, while disagreement means the evidence supports different risks. The final call remains yours.',
        predictor: { recommendation: local.predictor, evidence: snapshot.forecastRainProbability + '% forecast around lap ' + (Math.floor(snapshot.rainOnsetProgress) + 1) + '.', confidence: 'medium' },
        scanner: { recommendation: local.scanner, evidence: 'Live rain ' + Math.round(snapshot.rain * 100) + '%, grip ' + snapshot.grip + '%.', confidence: 'medium' },
        adaptiveDriver: { recommendation: local.adaptiveDriver, evidence: 'Objective ' + config.priority + ', incident risk ' + snapshot.incidentRisk + '%.', confidence: 'medium' },
      }
      setVerdict(fallback)
      setExplanation(fallback.explanation)
      setSource('browser-fallback')
    } finally {
      setExplaining(false)
    }
  }

  useEffect(() => {
    if (!decisionOpen) {
      requestedWindow.current = false
      return
    }
    if (!snapshot || requestedWindow.current) return
    requestedWindow.current = true
    void explain()
  }, [decisionOpen, snapshot])

  return (
    <main className="race-shell page-transition">
      <Suspense fallback={<div className="scene-loading">Loading autonomous circuit…</div>}>
        <RaceScene
          config={config}
          strategy={strategy}
          decision={decision}
          pitCommand={pitCommand}
          paused={paused || decisionOpen}
          onSnapshot={setSnapshot}
          onNeedDecision={() => {
            setDecision(null)
            setVerdict(null)
            setExplanation('')
            setSource('')
            setDecisionOpen(true)
          }}
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
        <button className="box-command" disabled={Boolean(snapshot?.racers[0].inPit)} onClick={() => {
          if (snapshot?.pitRequested) {
            setPitCommand((current) => ({ id: current.id + 1, tyre: null }))
            setPitMenuOpen(false)
          } else {
            const opening = !pitMenuOpen
            setPitMenuOpen(opening)
            if (opening) void explain()
          }
        }}>{snapshot?.racers[0].inPit ? 'In pit' : snapshot?.pitRequested ? 'Cancel box call' : 'Box this lap'}</button>
        {pitMenuOpen && !snapshot?.pitRequested && <div className="manual-pit-menu"><span>SELECT COMPOUND</span><div className="manual-pit-advice"><b>RACE ENGINEER · {explaining ? 'ANALYSING LIVE…' : source === 'openai' ? 'GPT-5.6' : 'CALCULATED'}</b><strong>{manualVotes}/3 systems favour boxing · {tyreProfiles[manualRecommendation].name} recommended</strong>{explanation ? <SafeRichText text={explanation} /> : <small>Reading current rain, grip, wear, temperature, traffic, risk, and your setup…</small>}</div>{tyreOptions.map(([tyre]) => <button key={tyre} className={tyre === manualRecommendation ? 'recommended' : ''} onClick={() => {
          setPitCommand((current) => ({ id: current.id + 1, tyre }))
          setPitMenuOpen(false)
        }}><i style={{ borderColor: tyreProfiles[tyre].color }}>{tyreProfiles[tyre].code}</i>{tyreProfiles[tyre].name}</button>)}</div>}
      </section>

      {config.mode === 'guided' && snapshot && !snapshot.scannerAlert && (
        <div className="coach-callout"><span>RACE ENGINEER</span>Your autonomous driver follows the setup. Change only high-level strategy from the pit wall.</div>
      )}

      {decisionOpen && snapshot && (
        <DecisionModal
          snapshot={snapshot}
          config={config}
          explanation={explanation}
          source={source}
          verdict={verdict}
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
          <p className="eyebrow">Simulation held · Telemetry frozen</p><h2>Run paused</h2>
          <span className="pause-explanation">No strategy has changed. Resume when you are ready to continue the autonomous session.</span>
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
  const player = snapshot.racers[0]
  const pitDuration = player.pitStopDuration ?? 0
  const pitElapsed = Math.max(0, pitDuration - player.pitTimeRemaining)
  const stationaryDuration = pitDuration * 0.4
  const stationaryElapsed = Math.max(0, Math.min(stationaryDuration, pitElapsed - pitDuration * 0.3))
  const pitPhase = !player.inPit && pitDuration > 0
    ? 'STOP COMPLETE'
    : (player.pitLanePhase ?? 0) < 0.45
      ? 'PIT ENTRY · LIMITER'
      : (player.pitLanePhase ?? 0) <= 0.55
        ? 'TYRE SERVICE'
        : 'PIT EXIT · RELEASE'
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
        <Signal code="ML" role="PREDICTS" title="Predictor" state={'Rain ' + snapshot.forecastRainProbability + '% · Expected ' + formatSeconds(snapshot.predictedLapSeconds)} confidence="MED" color="orange" metric={snapshot.forecastRainProbability + '%'} />
        <Signal code="DL" role="DETECTS" title="Pattern Scanner" state={snapshot.scannerAlert ? 'Rear heat · Track ' + snapshot.trackTemp.toFixed(1) + '°' : 'Scanning live telemetry'} confidence={snapshot.scannerAlert ? 'ALERT' : 'LIVE'} color="cyan" />
        <Signal code="RL" role="ADAPTS" title="Adaptive Driver" state={snapshot.adaptiveAlert ? 'Braking point changed after grip loss' : config.mode === 'guided' ? 'Cyan policy line · ' + snapshot.strategyCommand + ' pace' : 'Learning from ' + snapshot.strategyCommand + ' command'} confidence={snapshot.adaptiveAlert ? 'CHANGED' : 'READY'} color="violet" />
      </aside>
      <section className="telemetry-stack">
        <CircuitMap circuit={config.circuit} progress={snapshot.lapProgress} compact />
        {pitDuration > 0 && (
          <div className={'pit-timing-readout ' + (player.inPit ? 'live' : 'complete')} data-testid="pit-timing">
            <header><span>{player.inPit ? 'PIT STOP · LIVE' : 'LAST PIT STOP'}</span><b>{pitPhase}</b></header>
            <div><strong>{stationaryElapsed.toFixed(2)}</strong><span>SECONDS STATIONARY</span></div>
            <footer><span>PIT-LANE ELAPSED</span><b>{pitElapsed.toFixed(1)} S</b></footer>
          </div>
        )}
        <Telemetry label={'TYRE WEAR · ' + tyreProfiles[snapshot.activeTyre].code} value={snapshot.tyreWear} suffix="%" />
        <Telemetry label="FUEL" value={snapshot.fuelRemaining} suffix="%" />
        <Telemetry label={'GRIP · ' + tyreProfiles[snapshot.activeTyre].code} value={snapshot.grip} suffix="%" />
        <Telemetry label="INCIDENT RISK" value={snapshot.incidentRisk} suffix="%" />
        <div className="steward-readout"><span>TRACK LIMITS <b>{snapshot.trackLimitStrikes}/3</b></span><span>PIT SPEED <b>{snapshot.pitSpeedKph === null ? '—' : snapshot.pitSpeedKph + ' KM/H'}</b></span><span>PENALTY <b className={snapshot.penaltySeconds > 0 ? 'penalty-active' : ''}>+{snapshot.penaltySeconds}s</b></span></div>
        <div className="weather-readout"><span>AIR <b>{snapshot.airTemp.toFixed(1)}°C</b></span><span>TRACK <b>{snapshot.trackTemp.toFixed(1)}°C</b></span><span>HUM <b>{snapshot.humidity}%</b></span><span>WIND <b>{snapshot.windKph} {snapshot.windDirection}</b></span></div>
        <div className="setup-readout" data-testid="active-tyre"><span>{snapshot.pitRequested ? 'PIT CONFIRM' : player.inPit ? 'BOX SERVICE' : 'SETUP'}</span><strong style={{ color: tyreProfiles[snapshot.activeTyre].color }}>{tyreProfiles[snapshot.activeTyre].code} ACTIVE{snapshot.pendingTyre ? ' → ' + tyreProfiles[snapshot.pendingTyre].code + ' AT SERVICE BAY' : ''} · {config.aero.toUpperCase()} AERO · {player.damage.toUpperCase()} DAMAGE</strong></div>
      </section>
      {latest && <div className="event-ticker"><span>LIVE</span>{latest}</div>}
    </>
  )
}

function Telemetry({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div className="telemetry-row"><span>{label}</span><div><i style={{ width: Math.max(2, Math.min(100, value)) + '%' }} /></div><strong>{Math.round(value)}{suffix}</strong></div>
}

function Signal({ code, role, title, state, confidence, color, metric }: { code: string; role: string; title: string; state: string; confidence: string; color: string; metric?: string }) {
  return <div className={'hud-signal ' + color + ' active'}><b>{code}<small>{role}</small></b><AISystemVisual system={code as 'ML' | 'DL' | 'RL'} active={confidence === 'ALERT' || confidence === 'CHANGED'} metric={metric} /><div><strong>{title}</strong><span>{state}</span></div><em>{confidence}</em></div>
}

function DecisionModal({
  snapshot,
  config,
  explanation,
  source,
  verdict,
  explaining,
  onExplain,
  onChoose,
}: {
  snapshot: RaceSnapshot
  config: RaceConfig
  explanation: string
  source: string
  verdict: ExplanationResponse | null
  explaining: boolean
  onExplain: () => void
  onChoose: (decision: RaceDecision) => void
}) {
  const formulaAdvice = evaluateSystemAdvice(snapshot, config)
  const advice = verdict
    ? { predictor: verdict.predictor.recommendation, scanner: verdict.scanner.recommendation, adaptiveDriver: verdict.adaptiveDriver.recommendation, alignment: verdict.alignment }
    : formulaAdvice
  const isConflict = advice.alignment === 'conflict'
  const dryRecovery = isWetTyre(snapshot.activeTyre) && snapshot.rain < 0.18
  return (
    <div className="decision-backdrop">
      <section className="decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="decision-kicker"><span>PIT WINDOW {String(snapshot.strategyWindowCount).padStart(2, '0')} · OPEN</span><b>Simulation paused</b></div>
        <h2 id="decision-title">{isConflict ? 'The systems disagree.' : 'The systems agree.'}<br />You make the call.</h2>
        <div className="conflict-lines">
          <div className="ml"><header><b>ML</b><span>FORECAST</span><em>{advice.predictor === 'pit' ? 'BOX' : 'STAY'}</em></header><AISystemVisual system="ML" active metric={snapshot.forecastRainProbability + '%'} /><p><strong>Predictor</strong><span>{verdict?.predictor.evidence || snapshot.forecastRainProbability + '% rain chance around lap ' + (Math.floor(snapshot.rainOnsetProgress) + 1) + '.'}</span></p><small>LOOKS AHEAD · PAST RUNS + SETUP</small></div>
          <div className="dl"><header><b>DL</b><span>LIVE EVIDENCE</span><em>{advice.scanner === 'pit' ? 'BOX' : 'STAY'}</em></header><AISystemVisual system="DL" active /><p><strong>Pattern Scanner</strong><span>{verdict?.scanner.evidence || (advice.scanner === 'pit' ? 'Telemetry risk supports an early stop.' : 'Track still dry.') + ' Rear wear ' + Math.round(snapshot.tyreWear) + '%.'}</span></p><small>LOOKS NOW · TRACK + TELEMETRY</small></div>
          <div className="rl"><header><b>RL</b><span>NEXT ACTION</span><em>{advice.adaptiveDriver === 'pit' ? 'BOX' : 'STAY'}</em></header><AISystemVisual system="RL" active /><p><strong>Adaptive Driver</strong><span>{verdict?.adaptiveDriver.evidence || (advice.adaptiveDriver === 'pit' ? 'Box to protect the configured objective.' : 'Stay out to protect track position.')}</span></p><small>ADAPTS · ACTIONS + CONSEQUENCES</small></div>
        </div>
        <p className="engineer-line">{isConflict ? '“Box this lap to cover the rain, or stay out for the overcut. Which signal matters most?”' : '“The evidence points the same way, but agreement is not certainty. Do you follow it or make the contrarian call?”'}</p>
        {(explaining || explanation) && <div className={'ai-explanation' + (explaining ? ' streaming' : '')}><header><span>Race engineer · {source === 'openai' ? 'GPT-5.6' : explaining ? 'CONNECTING' : 'Local briefing'}</span><b>{explaining ? 'Live analysis' : 'Evidence synthesis'}</b></header>{explanation ? <SafeRichText text={explanation} /> : <div className="ai-loading" role="status"><i aria-hidden="true" /><span>Reading forecast, telemetry, traffic, setup, and risk…</span></div>}</div>}
        <div className="decision-actions">
          <button className={'pit-action ' + (dryRecovery ? 'dry-action' : 'intermediate-action')} onClick={() => onChoose(dryRecovery ? 'pit-dry' : 'pit-intermediate')}><span>{dryRecovery ? 'Box, box · C3 Medium' : 'Box, box · Intermediates'}</span><small>{dryRecovery ? 'Recover dry-track pace' : 'Pit confirm · tyre changes at service bay'}</small></button>
          <button className="pit-action wet-action" onClick={() => onChoose('pit-wet')}><span>Box, box · Full wets</span><small>Pit confirm · maximum drainage</small></button>
          <button className="stay-action" onClick={() => onChoose('stay-out')}><span>Stay out</span><small>Attempt overcut · risk grip</small></button>
        </div>
        <button className="explain-action" onClick={onExplain} disabled={explaining}>{explaining ? 'Race engineer is thinking…' : explanation ? 'Refresh engineer analysis' : 'Ask race engineer why they ' + (isConflict ? 'disagree' : 'agree')}</button>
      </section>
    </div>
  )
}
