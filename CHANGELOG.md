# Changelog

All notable development changes to Neural Apex are recorded here.

## 2026-07-22

### Project structure

- Reorganized the frontend into `app`, feature-owned scenes/screens, `shared/ui`, a public `simulation` boundary, typed race-engineer services, and an explicit styles entrypoint.
- Extracted navigation and session-storage concerns from the application shell.
- Split the FastAPI monolith into route wiring, Pydantic schemas, prompt policy, and OpenAI/streaming/fallback execution modules without changing public endpoints.
- Added CONTRIBUTING, ROADMAP, and project-structure documentation; kept recording notes and submission checklists in the ignored private asset workspace.
- Consolidated Vitest, pytest, and Playwright coverage under independent `tests/unit`, `tests/backend`, and `tests/e2e` directories with frontend/backend/all-test scripts.
- Structured `.gitignore` rules by ecosystem and kept curated hackathon Markdown trackable while excluding local captures and video exports.
- Expanded the verification baseline to 57 frontend assertions, 8 backend checks, and 3 browser flows.
- Added a small curated README screenshot gallery while keeping raw captures and recording notes private.

## 2026-07-21

### Autonomous strategy product

- Reframed the experience around the team principal, strategist, and AI-systems operator; removed manual driving controls.
- Added distinct intro, tutorial, setup, race, and result routes with session-backed setup/results and a live-race leave warning.
- Added a richer first-run introduction, 3D race vignette, strategy orb, visual setup controls, help popovers, and a more visual tutorial.
- Added a root design system covering page hierarchy, AI visual grammar, 3D direction, broadcast UI, motion, responsive behavior, and design QA.
- Added compact tutorial diagrams for driver style, AI agreement, manual boxing, pit phases, penalties, and DNF risk.

### Race simulation and circuits

- Added Spa-, Silverstone-, and Barcelona-inspired circuits at 7.004 km, 5.891 km, and 4.657 km.
- Expanded circuit scale and added topology tests for raw centrelines, smoothed splines, and distinct full-width road sections.
- Added terrain-following road geometry, pits, forests, weather, clouds, sun, hills, and circuit backdrops.
- Grounded tyre contact to pitched road surfaces, projected trees onto terrain, enforced road clearance, and removed instanced-tree culling flicker.
- Added faster autonomous cars, traffic separation, probabilistic contact, minor damage, major accidents, and retirement.
- Added C1-C5 dry compounds, Intermediates, Full Wets, seeded dynamic weather, and 1-32 lap sessions with common-length presets.
- Added local curvature braking, progressive acceleration, and Cautious/Balanced/Aggressive driver styles.
- Added a curvature dead zone so fast sweepers retain speed while sharp corners trigger stronger braking.
- Raised world-space race pace by 16%, widened the fast-sweeper dead zone, and recalibrated the HUD to preserve distinct straight, sweeper, medium-corner, and hairpin speed bands.
- Recalibrated curvature from 1,000 samples on every circuit; the previous scale saturated most of Spa, Silverstone, and Barcelona as hairpins, while the new shared reference reserves heavy braking for genuinely tight sections.
- Added three-stage long-range corner look-ahead and bounded severity-weighted braking; retained more distant hairpin evidence and raised full-severity brake authority to 0.40–0.50 pace units per second so cars reach target speed before turn-in without a one-frame 100 km/h collapse.
- Replaced decorative centre drift with an outside–inside–outside autonomous racing line shared by cars and the Guided policy overlay.
- Smoothed racing-line targets across nearby samples and reduced lateral convergence speed for more natural corner entry and exit.
- Replaced unstable traffic warping with stable nearest-car overtaking targets and retained probabilistic contact/DNF.
- Rebuilt pit paths as parallel service-road branches and added limiter entry, service stop, and limiter exit phases.

### Strategy and broadcast systems

- Added an F1-inspired timing tower for practice, qualifying, and race states.
- Fixed Test/Qualifying completion so a zero clock produces the chequered flag and result transition; Race remains lap-based.
- Renamed the ambiguous pause-state “Strategy review” overlay to “Run paused” and clarified that telemetry is frozen without changing the strategy.
- Added track-limit warnings, cumulative time penalties, pit-speed checks, and steward context in results and GPT debriefs.
- Corrected the geometric track-limit threshold so legal apex and overtaking lanes no longer trigger automatic strikes.
- Changed pit decisions into queued calls: “Box, box” schedules a stop, while the active tyre changes only after pit entry.
- Added a broadcast pit timer that separates total pit-lane elapsed time from the live/final stationary tyre-service time.
- Added a persistent manual Box this lap compound menu with live advice and pre-entry cancellation.
- Made strategy windows conditional, lap-scaled, numbered, and capable of agreement or disagreement without forcing a first-lap prompt.
- Guaranteed one contextual ML/DL/RL pit-wall review in sessions of three laps or more, scheduled near 25% for softs, 50% for Medium, 75% for hards, and 33% for wets while allowing urgent weather evidence to trigger earlier; later windows remain escalation-gated.
- Labelled tyre wear and grip with the active compound so post-stop metrics cannot be mistaken for the removed tyre.
- Added visible ML forecast charts, DL scan grids, and RL state-action paths throughout setup, race, conflict, and tutorial views.
- Reduced the oversized setup statement and added a calculated setup-impact panel that explains tyre, driver, aero, and objective pace trade-offs—including dry-start wet-tyre penalties.

### AI and backend

- Added FastAPI endpoints for health, GPT-5.6 conflict explanations, and GPT-5.6 post-race debriefs.
- Added Pydantic Structured Outputs and NDJSON streaming endpoints with visible loading and progressive pit-wall/debrief text.
- Reworked the race-engineer loading state into a dedicated telemetry pulse and compacted manual pit-call analysis so it does not obscure the live race.
- Every GPT request now includes the complete relevant race/setup/evidence context.
- Kept deterministic race results in the browser and all OpenAI credentials/calls on the server.
- Added safe emphasis rendering and plain-text prompting so model output never exposes raw Markdown markers.

### Verification

- Added deterministic unit tests for movement, decisions, weather, collisions, retirement, penalties, pit entry, and result totals.
- Added topology tests for all three circuits.
- Expanded Playwright coverage for route transitions, queued tyre state, live GPT explanations, debriefs, and two-run comparison.
- Created working checkpoint commits `7ec46c7` and `0c2fbd7`.
