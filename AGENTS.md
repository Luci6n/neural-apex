# AGENTS.md

## Project

Neural Apex is a beginner-friendly, blocky 3D racing game that teaches the practical differences between Machine Learning, Deep Learning, and Reinforcement Learning through gameplay.

## Source of Truth

Before making changes:

1. Read `docs/PRD_v2.md`.
2. Use `docs/PRD.md` as the short index to the canonical v2 requirements.
3. Read all relevant files under `docs/`.
4. Inspect the existing implementation before proposing architecture changes.
5. Keep implementation aligned with the MVP and deadline.

If the code and documentation disagree, update the documentation or record the decision under `docs/decisions/`.

## Product Principles

- Teach through cause and effect, not technical lectures.
- Use plain language suitable for beginners.
- Avoid exposing concepts such as epochs, gradients, or loss functions in the player-facing experience.
- Present:
  - Machine Learning as prediction from past examples.
  - Deep Learning as recognition of complex patterns in images and telemetry.
  - Reinforcement Learning as adaptation through consequences.
- The AI systems are educational simulations, not claims of training real ML, DL, or RL models.
- The AI provides information, the race team interprets it, and the player makes the final decision.
- The player is the team principal, strategist, and AI systems operator.
- Every car drives autonomously. Do not add steering, throttle, braking, or boost controls.
- Player agency comes from setup, observation, strategic decisions, and comparing repeated runs.

## Development Priorities

Work in this order:

1. Playable end-to-end autonomous experiment loop
2. Stable blocky 3D track and cars
3. Bot opponents and one-click bot presets
4. ML, DL, and RL learning mechanics
5. Race engineer decisions
6. Guided tutorial
7. Post-race debrief
8. Docker reproducibility
9. Documentation and tests
10. Visual polish

Do not add major features until the core loop works.

## MVP Requirements

The MVP must include:

- three enlarged, non-crossing blocky 3D circuits;
- one player team;
- at least three bot opponents;
- one 1-8 lap autonomous race, qualifying session, or test run;
- pre-run tyre, fuel, aero, AI-priority, and strategy choices;
- telemetry and setup consequences visible during the run;
- at least one rerun comparison;
- no manual driving controls;
- one race engineer;
- one ML prediction mechanic;
- one DL telemetry or visual detection mechanic;
- one RL-inspired adaptive behaviour mechanic;
- one conflicting recommendation event;
- one Explain My Decision interaction using GPT-5.6 or fallback text;
- one post-race debrief;
- one completed scenario;
- basic difficulty selection;
- one-click bot presets;
- guided in-app tutorial;
- Docker-based startup;
- maintained documentation under `docs/`.

## Scope Constraints

Do not implement unless the MVP is already stable:

- real-time multiplayer;
- additional circuits beyond the implemented three;
- full career mode;
- realistic racing physics;
- realistic mechanical-damage simulation beyond minor contact, major accidents, and retirement;
- staff hiring;
- contracts;
- detailed finances;
- car development trees;
- user-generated tracks;
- large progression systems;
- voice communication;
- mobile support.

Prefer a finished vertical slice over a broad unfinished prototype.

## Technical Direction

Preferred stack:

- React
- Vite
- Three.js
- React Three Fiber
- FastAPI backend
- Docker

Implementation guidance:

- use primitive or low-poly geometry;
- use waypoint-based autonomous navigation for all cars;
- make setup choices visibly affect pace, tyre wear, fuel use, and behaviour;
- use deterministic or scripted race events;
- keep race duration short;
- use simple state machines for bot behaviour;
- keep GPT-5.6 calls limited to high-value explanations;
- provide local fallback explanations when GPT-5.6 is unavailable;
- avoid external dependencies unless they clearly reduce implementation risk.

## Docker Requirements

The project must run from a clean checkout with:

```bash
docker compose up --build
```

Required:

- root-level `Dockerfile`;
- `docker-compose.yml` when multiple services are used;
- `.env.example`;
- documented ports;
- no hidden local dependencies;
- a clear readiness or health verification;
- tested Docker startup before submission.

Do not report the project as complete if the documented Docker workflow fails.

## Documentation Requirements

Maintain documentation under:

```text
docs/
├── architecture.md
├── gameplay-loop.md
├── ai-learning-systems.md
├── bot-system.md
├── tutorial-flow.md
├── setup-and-deployment.md
├── testing.md
└── decisions/
```

Update documentation whenever behaviour, architecture, setup, or scope changes.

Record major decisions under `docs/decisions/`.

## Bot System Requirements

Players must be able to populate the race grid with one click.

Required presets:

- Rookie Grid
- Balanced Grid
- Competitive Grid
- Adaptive Rivals
- Fill Empty Slots

Players must be able to start without manually configuring individual bots.

Advanced bot customisation must remain optional.

## Tutorial Requirements

The tutorial must:

- be offered to first-time players;
- be skippable;
- be replayable;
- teach one concept at a time;
- use player actions and race events;
- pause or slow the race for important decisions when needed;
- end with a post-race learning summary.

The tutorial should avoid technical jargon.

## GPT-5.6 Usage

Use GPT-5.6 in this priority order:

- personalised post-race debriefs that combine the ML prediction, DL detection, RL-inspired adaptation, player decision consequence, and one plain-language lesson;
- on-demand race engineer explanations for conflicting recommendations;
- optional beginner-friendly explanations for individual race events;
- final architecture and integration review;
- difficult debugging.

Keep prompts concise and grounded in the current race state.

Do not rely on GPT-5.6 for core deterministic gameplay logic.

Use the thin FastAPI backend for GET /api/health, POST /api/explain, and POST /api/debrief. Keep OPENAI_API_KEY server-side. The frontend owns the deterministic race simulation and sends compact race-state snapshots. Both explanation endpoints must return local fallback copy when GPT-5.6 is unavailable so the playable and educational loops never block.

## Optional Coding Supervisors

Codex may use these local skills to reduce direct token usage:

- `C:\Users\User.codex\skills\antigravity-cli-supervisor\SKILL.md`
- `C:\Users\User.codex\skills\github-copilot-cli-supervisor\SKILL.md`

Suitable delegated tasks:

- repetitive implementation;
- scaffolding;
- utility functions;
- boilerplate;
- basic tests;
- small refactors;
- documentation drafts;
- clearly scoped UI components.

Codex must still:

- define the task precisely;
- review every returned diff;
- verify security and correctness;
- run tests and builds;
- update documentation;
- reject out-of-scope or low-quality code.

Use GPT-5.6 directly for architecture, complex integration, difficult debugging, and final review.

## Change Discipline

Before editing:

1. Identify the smallest set of files required.
2. Avoid broad rewrites unless necessary.
3. Preserve existing working behaviour.
4. Do not rename public interfaces without updating all references.
5. Keep commits focused.

After editing:

1. Run relevant tests.
2. Run lint.
3. Run the production build.
4. Run Docker verification when setup or integration changes.
5. Update documentation.
6. Review the final diff.
7. Commit a working checkpoint.

## Verification

Run the project verification script when available:

```bash
./scripts/verify.sh
```

Minimum verification:

```bash
npm ci
npm run lint
npm test -- --run
npm run build
docker compose build
```

If the repository uses different commands, update this file and `docs/testing.md`.

Do not claim completion while required verification fails.

## Definition of Done

A task is complete only when:

- the requested behaviour works;
- no known blocking regression remains;
- relevant tests pass;
- production build passes;
- documentation is current;
- Docker verification passes when applicable;
- the implementation matches the PRD;
- the final diff has been reviewed.

The project is submission-ready only when:

- one complete race is playable;
- bot presets work;
- the tutorial works;
- ML, DL, and RL concepts are demonstrated;
- race engineer decisions affect gameplay;
- post-race debrief works;
- GPT-5.6 usage is documented;
- README and `docs/` are accurate;
- `docker compose up --build` launches the application.
