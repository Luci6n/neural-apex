import { AISystemVisual } from '../../components/AISystemVisual'

const steps = [
  ['01', 'Configure', 'Set circuit, laps, tyre, fuel, aero, and AI priorities.', 'setup'],
  ['02', 'Launch', 'Cars drive themselves. You watch from the pit wall.', 'launch'],
  ['03', 'Interpret', 'Compare forecast, live detection, and adaptation.', 'signals'],
  ['04', 'Decide', 'Change pace or choose the right rain tyre.', 'decision'],
  ['05', 'Compare', 'Change one variable and measure the next run.', 'compare'],
] as const

const systems = [
  ['ML', 'Predictor', 'Past examples + setup', 'Lap estimate, weather probability, fuel and tyre risk', 'It can warn early, but a medium-confidence forecast may still be wrong.'],
  ['DL', 'Pattern Scanner', 'Live telemetry + visible track state', 'Tyre heat, grip change, rainfall and complex signal detection', 'It is strong at now, but may react after an early forecast already mattered.'],
  ['RL', 'Adaptive Driver', 'Actions + simulated consequences', 'Changed pace, braking point, racing line and conservation', 'It protects the current objective, which can conflict with future risk.'],
] as const

export function TutorialScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <main className="tutorial-shell page-transition">
      <header className="tutorial-header"><div><p className="eyebrow">Pit wall briefing · 2 minutes</p><h1>HOW TO RUN<br />THE RACE.</h1></div><button onClick={onBack}>← Back</button></header>
      <section className="tutorial-steps">
        {steps.map(([number, title, copy, visual]) => <article key={number}><span>{number}</span><StepVisual kind={visual} /><div><h2>{title}</h2><p>{copy}</p></div></article>)}
      </section>
      <section className="tutorial-learning">
        <div className="tutorial-section-heading"><span>THE THREE SYSTEMS</span><h2>Same race. Different evidence.</h2><p>The educational systems simulate three distinct AI jobs. None of them replaces your judgement.</p></div>
        <div className="tutorial-system-grid">
          {systems.map(([code, title, input, output, caution]) => <article className={code.toLowerCase()} key={code}><div className="tutorial-system-visual"><b>{code}</b><AISystemVisual system={code} active /></div><h3>{title}</h3><dl><dt>READS</dt><dd>{input}</dd><dt>OUTPUT</dt><dd>{output}</dd><dt>LIMIT</dt><dd>{caution}</dd></dl></article>)}
        </div>
      </section>
      <section className="tutorial-dashboard">
        <div><span>READ THE BROADCAST</span><h2>What to watch live</h2><DashboardDemo /></div>
        <ul>
          <li><b>Timing tower</b><span>Race position and interval; or best lap and out-lap status in practice/qualifying.</span></li>
          <li><b>Tyre badge</b><span>C1–C5 dry compounds, green intermediate, or blue full wet.</span></li>
          <li><b>Weather</b><span>Air and track temperature, humidity, wind, rain level, and their effect on grip and wear.</span></li>
          <li><b>Telemetry</b><span>Tyre wear, fuel, grip, current setup, and the car’s moving circuit position.</span></li>
          <li><b>AI rail</b><span>The latest Predictor, Pattern Scanner, and Adaptive Driver message.</span></li>
          <li><b>Status</b><span>IN PIT, OUT LAP, live interval, fastest lap, or FINISHED.</span></li>
        </ul>
      </section>
      <section className="tutorial-tyres">
        <div><span>TYRE QUICK GUIDE</span><h2>Fast is not always right.</h2></div>
        <div className="tyre-guide"><p><i className="hard" />C1–C2 <b>Hard</b><small>Durable, slower warm-up</small></p><p><i className="medium" />C3 <b>Medium</b><small>Balanced baseline</small></p><p><i className="soft" />C4–C5 <b>Soft</b><small>Faster, wears sooner</small></p><p><i className="inter" />I <b>Intermediate</b><small>Light rain / damp track</small></p><p><i className="wet" />W <b>Full Wet</b><small>Heavy rain / high drainage</small></p></div>
      </section>
      <section className="tutorial-callout"><div><span>THE RULE</span><h2>You never drive the car.</h2><p>Your job is to prepare the system, interpret imperfect evidence, and make the final strategic decision.</p></div><button className="start-race" onClick={onStart}><span>Open strategy setup</span><b>↗</b></button></section>
    </main>
  )
}

function StepVisual({ kind }: { kind: string }) {
  if (kind === 'setup') return <div className="step-visual setup"><i /><i /><i /><i /></div>
  if (kind === 'launch') return <div className="step-visual launch"><i /><span>›</span><i /></div>
  if (kind === 'signals') return <div className="step-visual signals"><b>ML</b><b>DL</b><b>RL</b></div>
  if (kind === 'decision') return <div className="step-visual decision"><i>STAY</i><span>OR</span><i>PIT</i></div>
  return <div className="step-visual compare"><i style={{ height: '42%' }} /><i style={{ height: '72%' }} /><span>+30%</span></div>
}

function DashboardDemo() {
  return <div className="tutorial-tower" aria-label="Example live timing tower"><header><b>RACE</b><span>LAP 2 / 5</span></header><div><b>1</b><i /><strong>NAX</strong><span>INTERVAL</span><em>C3</em></div><div><b>2</b><i /><strong>CC</strong><span>+0.8</span><em>C2</em></div><div><b>3</b><i /><strong>VV</strong><span>IN PIT</span><em>I</em></div><footer>TRACK 27° · RAIN 34%</footer></div>
}
