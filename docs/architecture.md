# Architecture

Neural Apex is an autonomous race-strategy simulator with a deterministic browser simulation and a thin FastAPI language boundary.

## Client

- React owns setup, pit-wall decisions, tutorial, debrief, and run history.
- React Three Fiber owns the circuit, autonomous cars, rain, camera, and renderer diagnostics.
- The simulation module owns setup formulas, waypoint movement, telemetry, bot state, scripted learning events, scoring, and comparisons behind one public API.
- The service module owns typed calls to FastAPI.

No manual-driving input enters the simulation. A RaceConfig and high-level StrategyCommand determine player-car behaviour.

## Ownership and trust boundaries

| Layer | Owns | Must not own |
| --- | --- | --- |
| React routes/features | Navigation, forms, HUD, modal state, run history | Race outcome calculations |
| TypeScript simulation module | Weather, movement, racing line, wear, fuel, grip, traffic, pits, incidents, penalties, scoring | OpenAI credentials or prose generation |
| React Three Fiber | Visual projection and renderer diagnostics | Authoritative race state |
| Frontend service | Typed payloads, NDJSON parsing, loading and source state | Hidden fallback or score mutation |
| FastAPI | Validation, secrets, OpenAI calls, structured streaming and fallback | Vehicle movement or player decisions |
| GPT-5.6 | Evidence synthesis and debrief language | Votes, physics, penalties, position, or score |

## Simulation flow

RaceConfig includes session, tyre, fuel, aero, weather policy, scanner focus, adaptive priority, driver style, difficulty, bot preset, and a visible weather seed. createRace derives the pre-run prediction and starting telemetry. advanceRace calculates local curvature braking, progressive acceleration, weather, wear, fuel, traffic, penalties, pit phases, and every autonomous car.

Strategy windows are event-driven and numbered. Sessions of at least three laps receive one compound-timed baseline review; urgent weather evidence may move it earlier. Escalating evidence after Stay out may produce another, subject to lap-scaled caps and spacing. A manual Box this lap call can queue any compound and be cancelled before entry. Tyres change only during the service-bay hold. createRunRecord stores setup plus outcome for the next comparison.

## Frontend feature map

~~~text
App
├─ IntroScreen
│  ├─ IntroScene
│  └─ IntroOrbScene
├─ TutorialScreen
├─ SetupScreen
│  ├─ prediction / forecast
│  ├─ ML-DL-RL preflight
│  └─ scenario controls
├─ RaceExperience
│  ├─ RaceScene
│  ├─ TimingTower
│  ├─ AI signal rail and telemetry
│  ├─ manual pit menu
│  └─ strategy window
└─ DebriefScreen
   ├─ deterministic result
   ├─ streamed GPT synthesis
   └─ previous-run comparison
~~~

`src/app/App.tsx` owns route-level orchestration, while `navigation.ts` and `session.ts` isolate URL and browser-storage concerns. `RaceScene` is colocated with the race feature and keeps the high-frequency mutable RaceSnapshot in a ref so animation frames do not force a full React render. It publishes throttled cloned snapshots to the HUD. Application code imports race-domain behavior through `src/simulation/index.ts`.

## Server

FastAPI:

- loads .env server-side;
- exposes health, structured explain/debrief endpoints, and NDJSON streaming variants;
- validates request shapes;
- calls GPT-5.6 through the OpenAI Responses API;
- streams loading/text deltas and returns a final validated payload, with explicit local fallback on failure;
- serves the built SPA in production.

The backend is split by responsibility: `main.py` owns HTTP/SPA wiring, `schemas.py` owns Pydantic contracts, `prompts.py` owns reviewable model instructions, and `race_engineer.py` owns OpenAI execution, streaming, parsing, and deterministic fallbacks.

Every GPT call receives the complete relevant snapshot including setup, racers, event log, penalties, damage, forecast, telemetry, decisions, and deterministic ML/DL/RL votes. GPT-generated text cannot mutate the simulation.

## Strategy streaming sequence

~~~text
Simulation meets evidence gate
  → RaceExperience pauses the run
  → deterministic votes appear immediately
  → frontend POSTs full context to /api/explain/stream
  → FastAPI validates the Pydantic request
  → Responses API streams structured text
  → frontend parses NDJSON status, delta, and complete events
  → player chooses pit or stay out
  → deterministic simulation resumes
~~~

The stream sends a quick human-readable field first and a complete validated object last. Source is explicit: openai or local-fallback.

## Rendering

Cars use low-poly primitive factories and follow a closed Catmull-Rom path. The camera is an elevated broadcast observation view. Movement is kinematic because repeatable setup-to-outcome relationships matter more than rigid-body realism.

Road, curb, racing-line, pit-lane, and terrain meshes are generated from sampled curves. Cars use a track-aligned basis so tyre contact follows elevation. Trees are projected to terrain and checked against sampled main/pit roads. Circuit tests reject centreline, edge, and pit-service crossings.

## Persistence

| Data | Lifetime |
| --- | --- |
| Principal name and setup | Session storage |
| Completed current/previous run | Session storage |
| Active frame-by-frame simulation | Memory only |
| Weather seed | Stored with setup and run record |
| OpenAI key | Server environment only |

Refreshing during a live run intentionally loses the unfinished simulation and triggers a browser warning. Completed runs can be revisited through the result route.

## Failure modes

- OpenAI unavailable: explicit local-fallback explanation; simulation continues.
- Stream interrupted: received text remains visible and the UI exposes retry.
- WebGL unavailable: surrounding semantic UI remains usable; the canvas is progressive enhancement.
- Invalid direct route: the app redirects to a valid route using session state when possible.
- Major incident: the run ends as a DNF and still produces a debrief.

## Runtime

During development, Vite proxies /api to FastAPI. The Docker deployment builds the frontend and lets FastAPI serve both the SPA and API on port 8787. The Vercel adapter in `api/index.py` re-exports the same FastAPI app as a Python Function; API-first rewrites preserve `/api/*`, while Vite static output and the SPA fallback own page routes.

See `docs/project-structure.md` for the complete directory map, dependency direction, and placement rules.
