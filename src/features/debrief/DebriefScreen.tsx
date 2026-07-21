import { useEffect, useState } from 'react'
import { createDebrief, createRace, formatSeconds, trackProfiles, tyreProfiles } from '../../simulation'
import type { RaceConfig, RaceSnapshot, RunRecord } from '../../simulation'
import { requestDebrief } from '../../services/race-engineer/client'
import { SafeRichText } from '../../shared/ui/SafeRichText'

export function DebriefScreen({
  race,
  config,
  currentRun,
  previousRun,
  onRunAgain,
  onAdjust,
}: {
  race: RaceSnapshot | null
  config: RaceConfig
  currentRun?: RunRecord
  previousRun?: RunRecord
  onRunAgain: () => void
  onAdjust: () => void
}) {
  const resolvedRace = race || createRace(config)
  const debrief = createDebrief(resolvedRace)
  const [coach, setCoach] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setCoach('')
    setLoading(true)
    requestDebrief(resolvedRace, config, (delta) => alive && setCoach((current) => current + delta))
      .then((data) => {
        if (!alive) return
        setCoach(data.debrief || debrief.lesson)
        setSource(data.source || 'local-fallback')
      })
      .catch(() => {
        if (alive) {
          setCoach(debrief.lesson)
          setSource('browser-fallback')
        }
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [config, debrief.lesson, resolvedRace])

  const delta = currentRun && previousRun ? currentRun.totalSeconds - previousRun.totalSeconds : null
  return (
    <main className="debrief-shell page-transition">
      <header className="debrief-header">
        <div><p className="eyebrow">Autonomous run complete · {trackProfiles[config.circuit].name}</p><h1>YOUR PLAN,<br />DECODED.</h1></div>
        <div className="result-lockup"><span>FINISH</span><strong>P{debrief.position}</strong><span>RUN TIME</span><strong>{formatSeconds(debrief.totalSeconds)}</strong><small>Score {debrief.score}/100</small></div>
      </header>

      {previousRun && currentRun && (
        <section className="comparison-strip">
          <div><span>PREVIOUS #{previousRun.id}</span><strong>{formatSeconds(previousRun.totalSeconds)}</strong><small>{tyreProfiles[previousRun.config.tyre].code} · {previousRun.config.aero} aero</small></div>
          <div className={delta !== null && delta <= 0 ? 'improved' : 'slower'}><span>CHANGE</span><strong>{delta !== null && delta > 0 ? '+' : ''}{formatSeconds(delta)}</strong><small>{delta !== null && delta <= 0 ? 'Faster experiment' : 'Trade-off exposed'}</small></div>
          <div><span>THIS RUN #{currentRun.id}</span><strong>{formatSeconds(currentRun.totalSeconds)}</strong><small>{tyreProfiles[currentRun.config.tyre].code} · {currentRun.config.aero} aero</small></div>
        </section>
      )}

      <section className="learning-grid">
        <article className="learning-card ml-card"><span>01 · MACHINE LEARNING</span><h2>Prediction</h2><p>{debrief.predictionOutcome}</p><strong>Past examples → what may happen</strong></article>
        <article className="learning-card dl-card"><span>02 · DEEP LEARNING</span><h2>Pattern</h2><p>{debrief.patternOutcome}</p><strong>Complex signals → what is happening</strong></article>
        <article className="learning-card rl-card"><span>03 · REINFORCEMENT LEARNING</span><h2>Adaptation</h2><p>{debrief.adaptationOutcome}</p><strong>Consequences → what to try next</strong></article>
      </section>

      <section className="decision-review">
        <div><p className="section-label">Your call · {debrief.decision === 'pit-dry' ? 'Pit for C3 Medium' : debrief.decision === 'pit-intermediate' ? 'Pit for intermediates' : debrief.decision === 'pit-wet' ? 'Pit for full wets' : 'Stay out'}</p><h2>{debrief.lesson}</h2></div>
        <div className={'coach-summary' + (loading ? ' streaming' : '')}><span>POST-RACE COACH · {source === 'openai' ? 'GPT-5.6' : loading ? 'CONNECTING' : 'LOCAL'}</span>{coach ? <SafeRichText text={coach} /> : <p className="ai-loading"><i /> Comparing prediction, detection, adaptation, setup, and your strategy…</p>}</div>
      </section>

      <footer className="debrief-actions">
        <button className="start-race" onClick={onAdjust}><span>Adjust setup & compare</span><b>↺</b></button>
        <button className="quiet-button" onClick={onRunAgain}>Repeat same plan</button>
        <p>Configure. Observe. Decide. Compare.</p>
      </footer>
    </main>
  )
}
