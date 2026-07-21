# Development Checklist

Updated: 2026-07-21

This file is the persistent implementation checklist for the current competition build. It is updated as feedback is implemented and verified.

## Product and navigation

- [x] Autonomous team-principal gameplay; no manual steering, throttle, braking, or boost.
- [x] FastAPI boundary for GPT-5.6 explanations and debriefs.
- [x] Intro, tutorial, setup, race, and result route structure implemented.
- [x] Live-race browser reload/leave warning implemented.
- [x] Verify browser route transitions and result/setup session restoration in E2E.
- [ ] Verify direct-route reload plus browser back/forward restoration manually.

## Intro and tutorial

- [x] Name registration and tutorial entry.
- [x] Native Three.js entry scene with floating race road and multiple cars.
- [ ] Restore and refine the dark strategy sphere as the intro scene's visual anchor.
- [ ] Position the strategy sphere in the central hero/form breathing space, separate from the upper-right road.
- [ ] Fix intro desktop composition: hero left, 3D race upper-right, registration below it.
- [x] Fix intro car orientation so cars face their direction of travel.
- [x] Increase 3D car/readability without overpowering the hero.
- [x] Explain what ML predicts, DL detects, and RL adapts.
- [x] Expand tutorial with AI systems, timing tower, weather, session status, and tyres.
- [ ] Finish concise side-by-side tutorial visuals and reduce remaining text density.

## Setup and AI education

- [x] C1-C5, Intermediate, and Full Wet tyre choices.
- [x] 1-8 lap selector.
- [x] Air temp, track temp, humidity, wind, and rain forecast.
- [x] Context help popovers for setup controls.
- [x] ML/DL/RL preflight briefing.
- [x] Finish visual setup controls: circuit silhouettes, tyre rings, fuel gauges, aero, weather, and priority icons.
- [x] Fix preflight chart/copy/confidence alignment.
- [x] Keep opponent model and scanner allocation choices horizontal on desktop.
- [x] Compact the run-length section and normalize legend/help-icon spacing.
- [x] Enlarge the setup header's team-principal identity/tutorial block.

## Circuits and 3D world

- [x] Three inspired circuits with corrected reference lengths.
- [x] Validate every raw path has zero non-adjacent segment intersections.
- [ ] Make Spa, Silverstone, and Barcelona recognisable from supplied red-line references.
- [x] Remove Silverstone/Barcelona false circular turns and curve overshoot.
- [x] Increase circuit footprint so nearby sections do not blend together.
- [ ] Ensure road ribbons do not self-overlap.
- [x] Procedural terrain supports track elevation.
- [ ] Keep pit lane, garages, and race-control buildings beside—not on—the racing surface.
- [ ] Ensure track and structures do not float.
- [x] Add low-poly pits, terrain, forest, clouds, sun, hills, and city/mountain backdrop.
- [ ] Add/verify circuit-specific grandstands and background composition.

## Race simulation

- [x] Faster autonomous speed and more detailed open-wheel cars.
- [x] Traffic separation and overtaking-lane response.
- [x] Setup/weather/strategy-based incident probability.
- [x] Minor damage, major accidents, and retirement states.
- [ ] Verify cars never visually occupy the same space under normal avoidance.
- [x] Add deterministic tests for collision, damage, and retirement.
- [x] Three track-limit strikes add five seconds.
- [x] Pit-lane speed over 80 km/h adds five seconds.
- [x] Pit choice queues the tyre change; active tyre changes only at pit entry.
- [x] Add deterministic tests for track-limit and pit-speed penalties.
- [x] Verify penalties affect final time and are included in GPT debrief context.

## Broadcast and AI UI

- [x] Left-side timing tower with session, lap/time, weather, ranking, interval/best time, tyre, pit/out-lap/finish status.
- [ ] Increase timing tower size and verify legibility at desktop/tablet/mobile sizes.
- [x] Live incident risk, damage, track-limit, pit-speed, and penalty readouts.
- [x] Visual ML forecast chart, DL heat scanner, and RL action path components.
- [ ] Verify visual instruments in setup, live HUD, conflict window, and debrief.
- [x] Safe GPT emphasis rendering; no raw double-asterisk markers.
- [x] Prompt GPT-5.6 for plain text only.

## Documentation and release

- [x] README links detailed Codex/GPT-5.6 usage document.
- [ ] Add root CHANGELOG.md.
- [ ] Update PRD_v2, AGENTS, README, architecture, gameplay, tutorial, API, testing, AI system docs, and ADRs.
- [ ] Document frontend deterministic simulation vs FastAPI language boundary.
- [ ] Update verification evidence after final checks.
- [ ] Run topology tests, unit tests, TypeScript, production build, E2E, live API, WebGL QA, and Docker.
- [x] Checkpoint commit: 7ec46c7.
- [ ] Commit penalty/navigation/circuit/scenery pass.
- [ ] Commit documentation and final verification pass.
- [ ] Final terminology polish: research and use authentic pit-wall calls such as Box, box; stay out; pit confirm; and pit limiter.
