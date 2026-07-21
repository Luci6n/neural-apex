import { AISystemVisual } from '../../components/AISystemVisual'

const steps = [
  ['01', 'Configure', 'Set circuit, laps, tyre, fuel, aero, and AI priorities.', 'setup'],
  ['02', 'Launch', 'Cars drive themselves. You watch from the pit wall.', 'launch'],
  ['03', 'Interpret', 'Compare forecast, live detection, and adaptation.', 'signals'],
  ['04', 'Decide', 'Change pace, follow or reject the evidence, or call Box this lap.', 'decision'],
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
      <section className="tutorial-race-rehearsal">
        <div className="tutorial-section-heading"><span>LIVE RACE REHEARSAL</span><h2>See the pit wall before launch.</h2><p>The cars move on their own. Read the timing tower, changing grip, and three AI signals while you make only high-level calls.</p></div>
        <RaceRehearsal />
      </section>
      <section className="tutorial-operations">
        <div className="tutorial-section-heading"><span>MAKE THE CALL</span><h2>Four controls. Real consequences.</h2><p>Use these during a run; steering, throttle, and braking remain autonomous.</p></div>
        <div className="operation-grid">
          <article><DriverStyleVisual /><h3>Driver style</h3><p>Cautious brakes earlier. Aggressive carries more corner speed but raises wear, fuel use, track-limit, and contact risk.</p></article>
          <article><AdviceVisual /><h3>Read agreement</h3><p>The systems may agree or conflict. Compare forecast, live evidence, and the adaptive objective before deciding.</p></article>
          <article><PitCycleVisual /><h3>Box this lap</h3><p>Pick a compound now. The car enters the pit lane, obeys the 80 km/h limiter, stops, changes tyres, then exits.</p></article>
          <article><StewardVisual /><h3>Finish cleanly</h3><p>Three track-limit strikes or pit speeding add five seconds. Contact can cause damage or a DNF.</p></article>
        </div>
      </section>
      <section className="tutorial-tyres">
        <div><span>TYRE QUICK GUIDE</span><h2>Fast is not always right.</h2></div>
        <div className="tyre-guide"><p><i className="hard" />C1–C2 <b>Hard</b><small>Durable, slower warm-up</small></p><p><i className="medium" />C3 <b>Medium</b><small>Balanced baseline</small></p><p><i className="soft" />C4–C5 <b>Soft</b><small>Faster, wears sooner</small></p><p><i className="inter" />I <b>Intermediate</b><small>Light rain / damp track</small></p><p><i className="wet" />W <b>Full Wet</b><small>Heavy rain / high drainage</small></p></div>
      </section>
      <section className="tutorial-callout"><div><span>THE RULE</span><h2>You never drive the car.</h2><p>Your job is to prepare the system, interpret imperfect evidence, and make the final strategic decision.</p></div><button className="start-race" onClick={onStart}><span>Open strategy setup</span><b>↗</b></button></section>
    </main>
  )
}

function RaceRehearsal() {
  const path = 'M 72 170 C 35 132 48 62 120 48 C 178 36 205 79 258 59 C 324 34 401 67 392 123 C 383 177 315 190 268 162 C 219 132 188 181 132 178 C 108 177 89 175 72 170 Z'
  return (
    <div className="race-rehearsal" aria-label="Animated example of the live autonomous race screen">
      <div className="rehearsal-tower">
        <header><b>RACE</b><span>LAP 2 / 5</span></header>
        <p><b>1</b><i className="orange" /><strong>NAX</strong><span>INTERVAL</span><em>C3</em></p>
        <p><b>2</b><i className="cyan" /><strong>CC</strong><span>+0.8</span><em>C2</em></p>
        <p><b>3</b><i className="violet" /><strong>VV</strong><span>PIT</span><em>I</em></p>
      </div>
      <div className="rehearsal-track">
        <svg viewBox="0 0 440 220" aria-hidden="true">
          <path className="rehearsal-grass" d="M0 0H440V220H0Z" />
          <path className="rehearsal-road-edge" d={path} />
          <path className="rehearsal-road" d={path} />
          <path className="rehearsal-line" d={path} />
          {['#ff633f', '#54e6ef', '#a88cff'].map((color, index) => (
            <circle key={color} r={index === 0 ? 5 : 4} fill={color}>
              <animateMotion dur={(4.8 + index * 0.65) + 's'} begin={(-index * 1.25) + 's'} repeatCount="indefinite" path={path} />
            </circle>
          ))}
        </svg>
        <div className="rehearsal-weather"><span>AIR <b>21°C</b></span><span>TRACK <b>29°C</b></span><span>RAIN <b>34%</b></span></div>
        <div className="rehearsal-command"><b>PIT WALL</b><span>PUSH</span><span className="active">HOLD PLAN</span><span>CONSERVE</span><span className="box">BOX THIS LAP</span></div>
      </div>
      <aside className="rehearsal-ai">
        <p className="ml"><b>ML</b><span>RAIN IN 1.4 LAPS</span><em>MED</em></p>
        <p className="dl"><b>DL</b><span>REAR HEAT RISING</span><em>ALERT</em></p>
        <p className="rl"><b>RL</b><span>PACE ADAPTED</span><em>CHANGED</em></p>
        <div><span>TYRE WEAR <b>18%</b></span><span>GRIP <b>86%</b></span><span>FUEL <b>71%</b></span></div>
      </aside>
    </div>
  )
}

function DriverStyleVisual() {
  return <div className="operation-visual driver"><span>CAUTIOUS<i style={{ width: '48%' }} /></span><span>BALANCED<i style={{ width: '68%' }} /></span><span>AGGRESSIVE<i style={{ width: '91%' }} /></span></div>
}

function AdviceVisual() {
  return <div className="operation-visual advice"><span><b>ML</b> BOX</span><span><b>DL</b> STAY</span><span><b>RL</b> BOX</span><em>2 / 3 · CONFLICT</em></div>
}

function PitCycleVisual() {
  return <div className="operation-visual pit-cycle"><span>BOX</span><i>→</i><span>80</span><i>→</i><span>STOP</span><i>→</i><span>I</span></div>
}

function StewardVisual() {
  return <div className="operation-visual steward"><span>LIMITS <b>3/3</b></span><span>PIT <b>84</b></span><em>+5s</em><strong>DNF RISK</strong></div>
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
