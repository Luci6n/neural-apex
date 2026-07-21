# Neural Apex Design System

Neural Apex is an AI race-strategy lab, not a manual driving game. Its design should make the player feel like the team principal on a pit wall: configure the experiment, read incomplete evidence, make a high-level call, and compare the outcome.

This document defines the product experience, visual language, interaction rules, and 3D direction used across the app.

## Experience promise

The interface should communicate three ideas within the first minute:

1. The cars are autonomous.
2. ML, DL, and RL observe different parts of the same race.
3. The player—not GPT and not any single model—makes the final strategy decision.

Every screen supports the loop:

~~~text
Configure → Predict → Launch → Observe → Decide → Debrief → Compare
~~~

## Design principles

### Evidence before decoration

Charts, badges, maps, and animations must expose simulation state. Decorative visuals may establish atmosphere, but cannot imply a mechanic that does not exist.

### Broadcast clarity

The live race borrows the information rhythm of a motorsport broadcast: timing on the left, speed/lap state above, AI evidence and telemetry on the right, and pit-wall controls along the bottom. It does not copy official F1 branding.

### One human call

ML orange, DL cyan, and RL violet may agree or conflict. Their visuals remain separate until the strategy window, where the evidence is compared side by side. Buttons make clear that advice is not an automatic command.

### Reproducible experimentation

The weather seed, setup, mode, and result remain visible. A player should understand what changed between two runs.

### Low-poly, high-information 3D

The 3D world uses simple authored geometry, strong silhouettes, readable tyre contact, restrained scenery, and elevated broadcast cameras. Realistic material complexity is less important than readable track topology, overtakes, pit movement, and weather.

## Page architecture

| Route | Primary job | Visual hierarchy |
| --- | --- | --- |
| Main | Explain the fantasy and register the team principal | Headline, autonomous 3D race, ML/DL/RL cards, strategy orb, entry form |
| Tutorial | Teach the loop visually | Five-step strip, system cards, live-race rehearsal, race-operation diagrams |
| Setup | Build a reproducible scenario | Hero/prediction split, mode explanation, grouped controls, forecast, grid |
| Race | Observe and intervene at strategy level | 3D track first; timing, AI rail, telemetry, and pit wall around it |
| Result | Explain what happened and invite comparison | Finish result, five-part debrief, setup/outcome comparison, rerun |

Routes are separate browser URLs. A live race warns before reload or navigation because an unfinished result is intentionally ephemeral.

## Color system

| Token | Value | Meaning |
| --- | --- | --- |
| Ink | #0a2442 | Primary shell, authority, timing and telemetry |
| Deep navy | #051628 | Live HUD and 3D contrast |
| Paper | #f3f1e7 | Strategy/setup reading surfaces |
| Orange | #ff633f | Human urgency, active call, ML accent |
| Cyan | #54e6ef | Live evidence, DL, selected telemetry |
| Violet | #a88cff | RL adaptation and policy |
| Green | #56d978 | Confirmed wet tyre, valid recommendation, safe state |
| Yellow | #ffd65a | Medium confidence, C3, caution |
| Red | #d94d35 | Penalty, destructive risk, Box command emphasis |

ML, DL, and RL colors are semantic. Do not swap them for page decoration:

- ML / Predictor: orange.
- DL / Pattern Scanner: cyan.
- RL / Adaptive Driver: violet.

## Typography

The display face is Impact or a compatible condensed fallback. It is reserved for major headlines, positions, and result statements.

Body copy uses a clean sans-serif. Monospace is used for telemetry labels, seeds, system states, lap counters, and small technical annotations.

Rules:

- Headlines should be short enough to read as shapes.
- Body copy should remain sentence case.
- Telemetry labels may be uppercase.
- Do not render raw Markdown. SafeRichText converts supported emphasis into controlled UI.
- Compact race panels use smaller type than full strategy modals.

## Shape and layout language

- Hard rectangular panels communicate pit-wall instrumentation.
- Thin one-pixel rules separate evidence.
- Orange top rules indicate an active decision surface.
- Cyan offset shadows indicate an interactive or AI-supported panel.
- Circles are reserved for tyre compounds, weather states, nodes, and status lights.
- Avoid excessive border radii; the product should feel engineered rather than consumer-soft.

Desktop composition uses deliberate asymmetry. Setup/result reading surfaces can be split light/dark. Live-race HUD panels float at screen edges and must not cover the player car at the default camera distance.

## AI visual grammar

Text alone is not enough. Every AI system has a recurring diagram:

| System | Diagram | Question answered |
| --- | --- | --- |
| Predictor | Forecast line with confidence/onset | What may happen next? |
| Pattern Scanner | Sensor grid and live detected cell | What is happening now? |
| Adaptive Driver | State/action node path | What action should adapt next? |

Setup icons also encode behavior:

- Opponent Rookie: a single calm node.
- Opponent Pro: rising performance bars.
- Opponent Adaptive: a branching decision network.
- Scanner Vision: camera/target reticle.
- Scanner Balanced: mixed channel grid.
- Scanner Telemetry: data bars.

Strategy windows may say agree-pit, agree-stay, or conflict. The title and action copy must reflect the actual alignment; disagreement is not forced.

## 3D world direction

### Cars

Cars are stylized open-wheel vehicles built from primitives. Required silhouette details are exposed wheels, front wing, sidepods, cockpit/halo, engine cover, and rear wing.

Tyres must contact the road plane. Cars align to the road tangent and surface pitch. Rivals may pass alongside but may not ghost through or occupy the same visual volume under normal avoidance.

### Racing line

The autonomous line is derived from circuit curvature:

~~~text
outside entry → inside apex → outside exit → stable straight
~~~

Driver style controls track usage. Aggressive uses more width; Cautious leaves margin. The cyan line is a Guided-mode policy overlay, not a painted road centre line.

The target is smoothed across a weighted look-behind/look-ahead window. Cars converge progressively so S-bends and entry/apex/exit transitions read as one flowing path rather than discrete lane changes.

### Circuits and pits

The three circuit silhouettes are inspired by Spa-Francorchamps, Silverstone, and Barcelona-Catalunya while using original low-poly presentation and names.

Road ribbons must not self-intersect. Pit entry and exit are connected branches beside the main circuit. Pit buildings, trees, grandstands, and backdrops must pass a clearance check so they do not occupy the racing surface.

### Environment

Terrain follows circuit elevation and supports tree/building placement. Weather changes sky, fog, rain particles, grip, temperatures, and telemetry together. Scenery should frame the track without blocking the broadcast camera.

## Live broadcast hierarchy

1. Timing tower: session state, position, lap/time, gaps or best laps, tyre, pit/out-lap/finish state.
2. Top HUD: player position, lap, autonomous speed, pause.
3. AI rail: latest ML/DL/RL evidence with small diagrams.
4. Telemetry: map, tyre wear, fuel, grip, incident risk, penalties, environment.
5. Pit wall: Push, Hold, Conserve, and Box this lap.

The timing tower and right rail should remain legible at desktop widths. Mobile may stack panels, but must preserve access to race status and pit-wall commands.

## Motion

Motion communicates state:

- page entry: brief fade/translate;
- buttons: two-pixel lift and pressed scale;
- cards: restrained depth on hover;
- GPT: visible connecting state, progressive text stream, cursor;
- AI diagrams: small pulse or path movement;
- 3D cars: continuous autonomous motion, progressive braking and acceleration;
- rain/clouds: wind-linked movement.

Respect prefers-reduced-motion. Essential state changes must still be understandable without animation.

## Content voice

Use concise race-engineer language:

- Box, box.
- Stay out.
- Pit confirm.
- Pit limiter engaged.
- Release when clear.
- Push pace / Hold plan / Conserve tyres.

Explain uncertainty directly. Never claim the educational ML/DL/RL models are trained production systems. Never imply GPT calculates the result or drives the car.

## Responsive and accessibility rules

- Keyboard focus must remain visible.
- Buttons require text labels; icons are supplementary.
- Color is never the only status cue.
- Strategy cards wrap without horizontal scrolling.
- Text remains readable at 200 percent zoom.
- Canvas visuals have surrounding textual explanations.
- Reduced-motion preferences disable nonessential animation.
- HUD panels must not overlap each other at defined breakpoints.

## Implementation map

| Concern | Source |
| --- | --- |
| Global tokens and responsive rules | src/styles.css |
| Intro 3D scenes | src/components/IntroScene.tsx |
| Race world and procedural geometry | src/components/RaceScene.tsx |
| AI diagrams | src/components/AISystemVisual.tsx |
| Setup visual controls | src/features/setup/SetupScreen.tsx |
| Live broadcast and strategy windows | src/features/race |
| Tutorial visual language | src/features/tutorial/TutorialScreen.tsx |
| Simulation formulas and racing line | src/game/simulation.ts and src/game/tracks.ts |

## Design QA checklist

- Does the screen state the player’s role without implying manual driving?
- Are ML, DL, and RL visually distinct and factually consistent?
- Does each diagram expose real state?
- Are cars, tyres, trees, structures, road, and pit lane grounded?
- Is the racing line visibly outside–apex–outside?
- Do gentle bends remain fast and sharp corners trigger braking?
- Can timing, AI evidence, telemetry, and commands be read simultaneously?
- Do strategy cards handle long streamed GPT text?
- Does the layout work at desktop, tablet, mobile, zoom, and reduced motion?
- Are limits and educational-model boundaries stated honestly?
