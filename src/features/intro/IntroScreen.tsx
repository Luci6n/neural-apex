import { lazy, Suspense, useState } from 'react'

const IntroScene = lazy(() => import('../../components/IntroScene').then((module) => ({ default: module.IntroScene })))
const IntroOrbScene = lazy(() => import('../../components/IntroScene').then((module) => ({ default: module.IntroOrbScene })))

export function IntroScreen({ initialName, onEnter, onTutorial }: { initialName: string; onEnter: (name: string) => void; onTutorial: () => void }) {
  const [name, setName] = useState(initialName)
  const validName = name.trim().length >= 2
  return (
    <main className="intro-shell page-transition">
      <div className="intro-grid" aria-hidden="true" />
      <header className="intro-brand"><div className="brand-mark"><span /><span /><span /></div><strong>NEURAL APEX</strong><span>AI RACE STRATEGY LAB</span></header>
      <div className="intro-visual">
        <Suspense fallback={<span>Loading autonomous strategy model…</span>}><IntroScene /></Suspense>
        <div className="intro-visual-labels"><b className="ml">ML · FORECAST</b><b className="dl">DL · DETECT</b><b className="rl">RL · ADAPT</b></div>
      </div>
      <div className="intro-orb" aria-hidden="true">
        <Suspense fallback={null}><IntroOrbScene /></Suspense>
      </div>
      <section className="intro-hero">
        <p className="eyebrow">Three AI systems. One human call.</p>
        <h1>BUILD THE PLAN.<br /><i>READ THE AI.</i><br />CALL THE RACE.</h1>
        <p className="intro-copy">Lead an autonomous race team through changing weather. Each AI sees a different part of the problem. Compare their evidence, make the pit-wall call, and learn why the outcome changed.</p>
        <div className="intro-ai-grid">
          <article className="ml"><b>ML</b><div><strong>Predictor</strong><p>Uses past race examples and your setup to forecast lap time, rain timing, fuel margin, and tyre risk.</p><small>OUTPUT · WHAT MAY HAPPEN + CONFIDENCE</small></div></article>
          <article className="dl"><b>DL</b><div><strong>Pattern Scanner</strong><p>Reads live track and telemetry patterns to detect tyre heat, grip loss, rain, and unusual behaviour.</p><small>OUTPUT · WHAT IS HAPPENING NOW</small></div></article>
          <article className="rl"><b>RL</b><div><strong>Adaptive Driver</strong><p>Responds to consequences by changing pace, braking points, racing line, and tyre conservation.</p><small>OUTPUT · WHAT TO TRY NEXT</small></div></article>
        </div>
      </section>
      <form className="enter-card" onSubmit={(event) => { event.preventDefault(); if (validName) onEnter(name.trim()) }}>
        <span className="section-label">Pit wall registration</span>
        <h2>Who is running the team?</h2>
        <label htmlFor="principal-name">Team principal name</label>
        <input id="principal-name" value={name} maxLength={24} autoComplete="name" placeholder="Enter your name" onChange={(event) => setName(event.target.value)} />
        <button className="start-race" type="submit" disabled={!validName}><span>Enter strategy lab</span><b>↗</b></button>
        <button className="intro-tutorial" type="button" onClick={onTutorial}>How to play · 2 min briefing</button>
        <small>The systems advise. You decide. The cars drive themselves.</small>
      </form>
    </main>
  )
}
