# Development Checklist

Updated: 2026-07-22

This file is the persistent implementation checklist for the current competition build. It is updated as feedback is implemented and verified.

## Product and navigation

- [x] Autonomous team-principal gameplay; no manual steering, throttle, braking, or boost.
- [x] FastAPI boundary for GPT-5.6 explanations and debriefs.
- [x] Intro, tutorial, setup, race, and result route structure implemented.
- [x] Live-race browser reload/leave warning implemented.
- [x] Verify browser route transitions and result/setup session restoration in E2E.
- [x] Tutorial Back returns to the page that opened it (main or setup).
- [x] Setup header includes a direct Back to main action.
- [ ] Verify direct-route reload plus browser back/forward restoration manually.

## Intro and tutorial

- [x] Name registration and tutorial entry.
- [x] Native Three.js entry scene with floating race road and multiple cars.
- [ ] Restore and refine the dark strategy sphere as the intro scene's visual anchor.
- [ ] Position the strategy sphere in the central hero/form breathing space, separate from the upper-right road.
- [x] Add a tiny animated open-wheel car to the strategy sphere's orbital ring.
- [x] Add a second differently coloured orbiting car and enlarge the orb canvas to prevent clipping.
- [ ] Fix intro desktop composition: hero left, 3D race upper-right, registration below it.
- [x] Fix intro car orientation so cars face their direction of travel.
- [x] Increase 3D car/readability without overpowering the hero.
- [x] Explain what ML predicts, DL detects, and RL adapts.
- [x] Expand tutorial with AI systems, timing tower, weather, session status, and tyres.
- [ ] Finish concise side-by-side tutorial visuals and reduce remaining text density.
- [x] Add a concrete animated live-race rehearsal with cars, timing, weather, telemetry, commands, and AI calls.

## Setup and AI education

- [x] C1-C5, Intermediate, and Full Wet tyre choices.
- [x] 1-32 lap selector with 8/16/24/32 presets.
- [x] Make Guided, Quick Start, and Free Lab differences explicit; Quick Start applies a visible balanced preset.
- [x] Document how every setup choice changes pace, wear, fuel, grip, detection, traffic, or risk.
- [x] Add Cautious, Balanced, and Aggressive driver styles as real formula inputs.
- [x] Air temp, track temp, humidity, wind, and rain forecast.
- [x] Context help popovers for setup controls.
- [x] ML/DL/RL preflight briefing.
- [x] Finish visual setup controls: circuit silhouettes, tyre rings, fuel gauges, aero, weather, and priority icons.
- [x] Fix preflight chart/copy/confidence alignment.
- [x] Keep opponent model and scanner allocation choices horizontal on desktop.
- [x] Compact the run-length section and normalize legend/help-icon spacing.
- [x] Enlarge the setup header's team-principal identity/tutorial block.
- [x] Reduce the setup hero statement and use the right-column dead space for a calculated setup-impact readout.

## Circuits and 3D world

- [x] Three inspired circuits with corrected reference lengths.
- [x] Validate every raw path has zero non-adjacent segment intersections.
- [ ] Make Spa, Silverstone, and Barcelona recognisable from supplied red-line references.
- [x] Remove Silverstone/Barcelona false circular turns and curve overshoot.
- [x] Increase circuit footprint so nearby sections do not blend together.
- [x] Validate both full-width road edges have zero non-adjacent intersections.
- [ ] Visually verify road ribbons do not crowd at close parallel sections.
- [x] Procedural terrain supports track elevation.
- [ ] Keep pit lane, garages, and race-control buildings beside—not on—the racing surface.
- [ ] Remove terrain bleed-through, floating scenery, and abrupt pit-entry/exit ribbons across all three circuits.
- [ ] Ensure track and structures do not float.
- [x] Add low-poly pits, terrain, forest, clouds, sun, hills, and city/mountain backdrop.
- [ ] Add/verify circuit-specific grandstands and background composition.

## Race simulation

- [x] Faster autonomous speed and more detailed open-wheel cars.
- [x] Traffic separation and overtaking-lane response.
- [x] Setup/weather/strategy-based incident probability.
- [x] Replace the fixed first-lap strategy prompt with a seeded, variable forecast/decision timeline, including possible false-positive rain forecasts.
- [x] Let ML, DL, and RL sometimes agree and sometimes conflict based on their evidence and configured objectives.
- [x] Query GPT-5.6 automatically at every strategy window with the full live snapshot and validated structured agreement/advice output.
- [x] Number each strategy window and suppress frequent/late windows with evidence, spacing, pit-state, and final-quarter-lap gates.
- [x] Guarantee one tyre-timed ML/DL/RL review for 3+ laps (soft 25%, Medium 50%, hard 75%, wet 33%) while allowing earlier weather triggers and keeping later windows evidence-gated.
- [x] Offer a C3 recovery choice when wet tyres are mismatched to a dry circuit.
- [x] Add local curvature braking and progressive corner-exit acceleration for player and rival cars.
- [x] Smooth corner braking with long-range look-ahead and a bounded, severity-weighted deceleration rate.
- [x] Display live stationary service time, total pit-lane elapsed time, and the completed stop time.
- [x] Raise real world-space pace and preserve speed through mild/fast bends without weakening sharp-corner braking.
- [x] Calibrate curvature distributions across all three circuits so hairpin braking covers only a small minority of each lap.
- [x] Add a manual Box this lap command, all compounds, calculated/GPT advice, and pre-entry cancellation.
- [x] Model pit limiter entry, service-bay stop, and limiter exit instead of a full-speed pit teleport.
- [x] Minor damage, major accidents, and retirement states.
- [ ] Verify cars never visually occupy the same space under normal avoidance.
- [ ] Enforce a full-car-width visual clearance while preserving probability-based contact and damage.
- [x] Add deterministic tests for collision, damage, and retirement.
- [x] Three track-limit strikes add five seconds.
- [x] Pit-lane speed over 80 km/h adds five seconds.
- [x] Pit choice queues the tyre change; active tyre changes only at the service bay.
- [ ] Add and verify a visible entry branch, parallel pit lane/service segment, and exit branch used by in-pit cars.
- [ ] Fix the shared pit lane generator so entry/exit never cross or bridge over the main road on any circuit.
- [x] Add deterministic tests for track-limit and pit-speed penalties.
- [x] Verify penalties affect final time and are included in GPT debrief context.

## Broadcast and AI UI

- [x] Left-side timing tower with session, lap/time, weather, ranking, interval/best time, tyre, pit/out-lap/finish status.
- [ ] Increase timing tower size and verify legibility at desktop/tablet/mobile sizes.
- [x] Live incident risk, damage, track-limit, pit-speed, and penalty readouts.
- [x] Visual ML forecast chart, DL heat scanner, and RL action path components.
- [ ] Verify visual instruments in setup, live HUD, conflict window, and debrief.
- [x] Safe GPT emphasis rendering; no raw double-asterisk markers.
- [x] Use Pydantic Structured Outputs for GPT-5.6 strategy and post-race analysis.
- [x] Show GPT loading state and stream strategy/debrief text progressively.
- [x] Fix strategy-window overflow and responsive evidence-card layout.
- [x] Separate the AI signal rail vertically from the telemetry panel.

## Documentation and release

- [x] README links detailed Codex/GPT-5.6 usage document.
- [x] Add root CHANGELOG.md.
- [x] Add root DESIGN.md and link it from README.
- [x] Update PRD_v2, AGENTS, README, architecture, gameplay, tutorial, API, testing, AI system docs, and ADRs.
- [x] Document frontend deterministic simulation vs FastAPI language boundary.
- [x] Document that every GPT strategy/debrief call receives full relevant race context and validated structured output.
- [x] Add gameplay calculation/mode guide and seeded-streaming ADR.
- [x] Update verification evidence for the current 57-frontend/10-backend/3-E2E checkpoint.
- [ ] Run topology tests, unit tests, TypeScript, production build, E2E, live API, WebGL QA, and Docker.
- [x] Checkpoint commit: 7ec46c7.
- [ ] Commit penalty/navigation/circuit/scenery pass.
- [ ] Commit documentation and final verification pass.
- [ ] Final terminology polish: research and use authentic pit-wall calls such as Box, box; stay out; pit confirm; and pit limiter.
- [x] Add consistent hover/press motion and reduced-motion-safe component depth.
- [x] Refactor the frontend into app, feature, simulation, service, shared UI, and styles boundaries.
- [x] Split FastAPI routes, schemas, prompts, and race-engineer execution into dedicated modules.
- [x] Add CONTRIBUTING.md, ROADMAP.md, project-structure documentation, and hackathon asset guides.
- [x] Add a roughly two-minute narrated demo script with recording fallbacks.
- [x] Move all automated tests into independent root `tests/unit`, `tests/backend`, and `tests/e2e` directories.
- [x] Structure `.gitignore` by dependency, secret, build, test, editor, and hackathon-asset concerns.
- [x] Add and test the Vercel FastAPI entrypoint, API-first rewrites, SPA fallback, and private bundle exclusions.
