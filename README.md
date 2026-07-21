# Neural Apex

> Learn AI at racing speed—without driving the car.

Neural Apex is an autonomous 3D race-strategy lab for beginner AI education. You are the team principal, race strategist, and AI systems operator. You configure the car and AI plan, launch an autonomous run, watch telemetry and racing lines, resolve conflicting recommendations, and adjust the setup for another experiment.

There are no steering, throttle, braking, or boost controls. Player skill comes from planning, observation, judgement, and comparison.

[OpenAI Buildathon competition](https://openai.devpost.com/)

## The learning idea

Neural Apex turns three abstract AI ideas into three visible race-team jobs:

| System | Beginner mental model | What it does in the race |
| --- | --- | --- |
| Predictor | Machine Learning predicts | Estimates rain, lap time, fuel use, and tyre risk from past examples and structured setup data |
| Pattern Scanner | Deep Learning recognises patterns | Watches live telemetry and track state for tyre heat, grip loss, and complicated signals |
| Adaptive Driver | Reinforcement Learning adapts | Changes pace, racing line, or braking behaviour after consequences |

The systems deliberately disagree. A prediction can warn about future rain while live track recognition still reports dry asphalt and the adaptive driver prefers protecting position. The AI advises; the player decides.

## What you do

1. Choose a guided tutorial, quick start, or free race lab.
2. Select a test run, qualifying simulation, or race.
3. Configure starting tyres, fuel load, aero balance, weather policy, scanner focus, and adaptive-driver priority.
4. Populate the autonomous grid with one click.
5. Review the Predictor’s expected lap and risk estimates.
6. Launch the run. Every car drives itself.
7. Watch position, lap time, racing line, tyre wear, fuel, grip, detections, and adaptation.
8. Send high-level pit-wall commands: push pace, hold plan, or conserve tyres.
9. Resolve the rain conflict by pitting for wets or staying out.
10. Review a GPT-5.6 post-race debrief.
11. Change the setup and rerun to compare the new result with the previous experiment.

## MVP highlights

- Blocky low-poly 3D circuit rendered with Three.js and React Three Fiber
- Autonomous player car and autonomous rival grid
- Setup-driven pace, tyre wear, fuel use, grip, and racing-line behaviour
- Test run, qualifying, and race session choices
- Rookie, balanced, competitive, and adaptive bot presets
- Live ML, DL, and RL-inspired signal rail
- High-level pace and tyre-conservation commands
- Paused strategy window with deliberately conflicting AI recommendations
- Live GPT-5.6 race-engineer explanation
- Five-part GPT-5.6 post-race debrief with deterministic fallback
- Previous-run benchmark and setup/outcome comparison
- Guided beginner tutorial language
- FastAPI boundary for OpenAI calls
- Docker-based single-service production runtime
- Unit, E2E, API, build, and measured WebGL verification

## Product flow

    Configure the experiment
              |
              v
    Launch autonomous session
              |
              v
    Observe 3D race + telemetry
              |
              v
    Resolve conflicting advice
              |
              v
    Review GPT-5.6 debrief
              |
              v
    Change one variable and compare

## Architecture

The browser owns deterministic gameplay. The FastAPI service owns language generation and secrets.

    React setup / pit wall / debrief
                    |
                    v
    Deterministic TypeScript race simulation
        |           |                 |
        v           v                 v
    R3F scene   telemetry/events   run history
                    |
                    v
              FastAPI service
        /api/health /explain /debrief
                    |
                    v
          OpenAI Responses API
                GPT-5.6

GPT-5.6 never controls a car, chooses a strategy, calculates a result, or changes score. It receives compact facts from the completed deterministic simulation and explains them in plain language.

## Repository structure

    neural-apex/
    ├── backend/
    │   └── main.py                  FastAPI, OpenAI calls, fallbacks, SPA serving
    ├── docs/
    │   ├── decisions/               Architecture and product decisions
    │   ├── PRD_v2.md                Current autonomous-game source of truth
    │   ├── architecture.md
    │   ├── ai-learning-systems.md
    │   ├── api-contract.md
    │   ├── bot-system.md
    │   ├── gameplay-loop.md
    │   ├── setup-and-deployment.md
    │   ├── testing.md
    │   └── tutorial-flow.md
    ├── src/
    │   ├── components/              Reusable 3D scene
    │   ├── features/
    │   │   ├── setup/               Experiment configuration
    │   │   ├── race/                Pit wall and autonomous run
    │   │   └── debrief/             Learning and run comparison
    │   ├── game/                    Types, bot config, deterministic simulation
    │   ├── services/                FastAPI client boundary
    │   ├── App.tsx
    │   └── styles.css
    ├── tests/e2e/                    Two-run autonomous strategy test
    ├── Dockerfile
    ├── docker-compose.yml
    └── package.json

## Quick start on Windows

Requirements:

- Node.js 22 or newer
- CPython 3.11 or newer
- OpenAI API key for live GPT-5.6 text; optional for fallback mode

Install:

    npm install
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    python -m pip install -r requirements.txt
    Copy-Item .env.example .env

Add your key to .env:

    OPENAI_API_KEY=your_key_here
    OPENAI_MODEL=gpt-5.6

Start both Vite and FastAPI:

    npm run dev

Open http://localhost:5173.

The Vite server proxies /api requests to FastAPI at http://localhost:8787.

## Docker

Docker is the easiest production-like path:

    docker compose up --build

Open http://localhost:8787.

Verify readiness:

    Invoke-WebRequest http://localhost:8787/api/health

Expected shape:

    {
      "ok": true,
      "service": "neural-apex",
      "aiConfigured": true
    }

aiConfigured reports only whether the key exists. It never returns the key.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| OPENAI_API_KEY | No for fallback; yes for live GPT | none | Server-side OpenAI authentication |
| OPENAI_MODEL | No | gpt-5.6 | Model used for conflict explanations and debriefs |

The frontend never receives OPENAI_API_KEY. Do not commit .env.

## API

### GET /api/health

Returns service readiness and whether AI is configured.

### POST /api/explain

Accepts the player’s question plus compact setup, telemetry, and conflicting recommendations. Returns a concise explanation and a source value of openai or local-fallback.

### POST /api/debrief

Accepts completed-run facts: setup, events, position, lap time, tyre/fuel state, and strategy choice. Returns one beginner-friendly synthesis covering prediction, detection, adaptation, team consequence, and lesson.

See docs/api-contract.md for payload examples and trust boundaries.

## Scripts

| Command | Purpose |
| --- | --- |
| npm run dev | Start Vite and FastAPI for local development |
| npm run dev:web | Start only Vite |
| npm run dev:api | Start only FastAPI |
| npm run lint | TypeScript project check |
| npm test | Deterministic simulation unit tests |
| npm run test:e2e | Two autonomous runs, live GPT flow, and comparison |
| npm run build | Production frontend build |
| npm run preview | Preview the built frontend |
| npm start | Start FastAPI, which serves the built SPA |

## Verification evidence

Current verified checks:

- TypeScript: pass
- Simulation tests: 3/3 pass
- Production build: pass
- Live OpenAI request through FastAPI: pass, source openai
- Full E2E: pass, including two runs and comparison
- Desktop WebGL canvas: nonblank, zero console/page errors
- Mobile WebGL canvas: nonblank, zero console/page errors
- Desktop render snapshot: 161 calls, 4,074 triangles, 97 geometries, 3 textures
- Mobile render snapshot: 133 calls, 3,650 triangles, 97 geometries, 3 textures
- Production dependency audit: zero vulnerabilities

The bundled Three.js QA thresholds are 300 desktop calls and 150 mobile calls, so both measured snapshots are within the starting budgets.

## GPT-5.6 usage

GPT-5.6 is concentrated in the two moments where language creates the most educational value:

1. Post-race debrief: connects the Predictor’s expectation, Scanner’s detection, Driver’s adaptation, team decision, and one plain-language lesson.
2. Conflict explanation: explains why future prediction, present recognition, and consequence-based strategy can disagree.

FastAPI returns deterministic local explanations if the key is missing, the API is unavailable, or the request fails. The race always remains playable.

## How Codex was used

Codex helped turn the PRD into the autonomous strategy architecture, discover and apply relevant Three.js/React/testing skills, implement and refactor the full stack, diagnose integration defects, and run unit, E2E, Docker, API, and measured WebGL QA. GPT-5.6 is the in-product race engineer and learning coach; it is deliberately separated from deterministic gameplay.

For the detailed development record, boundaries, prompts, fallbacks, verification, and submission evidence, see [How Codex and GPT-5.6 are used](docs/codex-and-gpt-usage.md).

## Honest limitations

- The ML, DL, and RL systems are educational simulations using deterministic formulas, rules, and state changes; no model is trained in the browser.
- One Sudden Rain scenario is fully implemented.
- Vehicle movement is kinematic and waypoint-based, not realistic motorsport physics.
- Run history is held in browser memory and resets on refresh.
- Bot adaptation is lightweight and scenario-scoped.
- The Three.js race chunk is still large, but it is lazy-loaded so the setup screen ships in a much smaller initial bundle. Further vendor splitting is a post-MVP optimisation.
- Real-time multiplayer, careers, detailed damage, and user-created tracks are out of scope.

## Three-minute demo

- 0:00–0:25 — Show the problem: beginner AI education is abstract.
- 0:25–0:55 — Configure tyre, fuel, aero, scanner, adaptive priority, and bot grid.
- 0:55–1:25 — Launch the autonomous race and point out live telemetry and racing line.
- 1:25–1:55 — Show the three systems disagreeing and request GPT-5.6’s explanation.
- 1:55–2:25 — Choose a strategy and show the weather consequence.
- 2:25–2:45 — Show the five-part debrief.
- 2:45–3:00 — Change one setup value and show previous-vs-current comparison.

## Documentation

- Current PRD: docs/PRD_v2.md
- Architecture: docs/architecture.md
- Gameplay loop: docs/gameplay-loop.md
- AI learning systems: docs/ai-learning-systems.md
- API contract: docs/api-contract.md
- Bots: docs/bot-system.md
- Tutorial: docs/tutorial-flow.md
- Setup and deployment: docs/setup-and-deployment.md
- Testing: docs/testing.md
- Codex and GPT-5.6 usage: docs/codex-and-gpt-usage.md
- Autonomous-strategy decision: docs/decisions/002-autonomous-strategy-loop.md

## Built with

React, TypeScript, Vite, Three.js, React Three Fiber, FastAPI, the OpenAI Responses API, Vitest, Playwright, and Docker.

The submission should include the primary Codex /feedback Session ID required by the competition form.
