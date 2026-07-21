# Tutorial Flow

The tutorial teaches a strategy experiment, not car control. It must prevent the common first-run mistake of expecting steering, throttle, or braking controls.

## Learning objectives

By the end, a player should be able to:

1. Explain the difference between ML prediction, DL detection, and RL adaptation.
2. Build a setup and understand which outcome categories it changes.
3. Read the timing tower, weather, telemetry, AI rail, penalties, and pit status.
4. Recognise that the systems may agree or conflict.
5. Use Push, Hold, Conserve, or Box this lap without directly driving.
6. Explain why a selected compound is not fitted until pit service.
7. Read the post-race debrief and rerun one changed variable.

## Entry paths

| Entry | Tutorial behavior |
| --- | --- |
| Main page | Back returns to the main page and preserves the entered principal name. |
| Setup page | Back returns to the setup and preserves the current configuration. |
| Direct URL | Back uses browser history when available and falls back safely. |

## Two-minute visual briefing

### 1. Configure

Show setup sliders/cards rather than a paragraph. Cover circuit, session, laps, tyre, fuel, aero, weather policy, driver style, scanner, RL priority, and rivals.

### 2. Launch

State: Cars drive themselves. You watch from the pit wall.

The launch visual shows autonomous cars moving with no input device or steering prompt.

### 3. Interpret

The system cards use the same diagrams as the live app:

| System | Reads | Produces | Limitation |
| --- | --- | --- | --- |
| Predictor / ML | Historical scenario patterns and setup | Expected lap, rain probability, onset, fuel and tyre risk | A forecast can be uncertain or wrong. |
| Pattern Scanner / DL | Live telemetry and visible track state | Heat, rainfall, grip, and anomaly detection | Strong at now; may detect a change after an early forecast. |
| Adaptive Driver / RL | State, objective, actions, and consequences | Pace, braking, racing line, and conservation response | Optimises the configured objective, not every possible goal. |

### 4. Read the live broadcast

The animated rehearsal places visuals side by side:

- timing tower with lap, position, interval/best time, tyre, and pit status;
- moving circuit and autonomous cars;
- air/track temperature and rain;
- Push/Hold/Conserve/Box commands;
- ML/DL/RL live evidence;
- tyre wear, fuel, and grip.

### 5. Make high-level calls

Four compact diagrams explain:

- Driver style: Cautious, Balanced, Aggressive.
- Advice alignment: agree-pit, agree-stay, or conflict.
- Pit cycle: Box, limiter, service stop, tyre fit, exit.
- Steward risk: track limits, pit speed, damage, DNF.

### 6. Compare

The player changes one variable and reruns the same weather seed when they want a controlled experiment. New forecast intentionally changes the seed.

## Guided run sequence

1. Introduce the player as team principal.
2. State clearly that every car drives itself.
3. Select Guided mode.
4. Configure a baseline scenario.
5. Read the pre-launch ML/DL/RL panel.
6. Launch the autonomous run.
7. Watch speed change between straights, sweepers, and braking zones.
8. Follow the cyan policy line outside, to apex, and out.
9. Use one pace command.
10. If evidence qualifies, inspect the numbered strategy window.
11. Ask the race engineer for a streamed evidence synthesis.
12. Choose a pit compound or stay out.
13. Observe pit entry, 80 km/h limiter, service, and exit if boxing.
14. Review result, penalties, prediction, detection, adaptation, team decision, and lesson.
15. Change one setup value and compare.

## Conditional strategy windows

The tutorial must not promise that every run has a disagreement or even a window. A stable dry scenario may have no interruption. When a window opens, its heading and call-to-action reflect actual alignment:

- systems agree to pit;
- systems agree to stay out;
- systems disagree.

GPT receives the live snapshot and explains the evidence. It does not generate the votes, trigger the window, or choose for the player.

## Mode differences

| Mode | Coaching | Policy line | Setup |
| --- | --- | --- | --- |
| Guided | Full contextual prompts | Visible | Player-controlled |
| Quick Start | Short prompts | Hidden | Applies a visible balanced eight-lap preset; still editable |
| Free Lab | Minimal prompts | Hidden | Player-controlled |

All modes use identical physics after their visible setup values are established.

## Copy rules

- Prefer concrete observations over model jargon.
- Keep formulas in the calculations document, not the tutorial UI.
- Use race-engineer terms only when the player can see the corresponding state.
- Never imply that these are trained production ML/DL/RL systems.
- Never imply GPT drives, scores, or changes the simulation.
