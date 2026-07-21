# Contributing to Neural Apex

Neural Apex is a hackathon-sized autonomous race-strategy lab. Contributions should strengthen the complete learning loop before expanding scope.

## Start here

1. Read `AGENTS.md` and `docs/PRD_v2.md`.
2. Read `docs/project-structure.md` before moving modules.
3. Check `docs/development-checklist.md` and `ROADMAP.md` for current priorities.
4. Preserve the core rule: the player configures and directs the team; every car drives autonomously.

## Local setup

~~~powershell
npm install
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
npm run dev
~~~

The OpenAI key is optional for local fallback mode. Never commit `.env` or expose a key to frontend code.

## Module rules

- `src/app/` owns routing and session persistence.
- `src/features/` owns feature-specific screens and 3D scenes.
- `src/shared/ui/` contains reusable presentation with no feature ownership.
- `src/simulation/` is the deterministic source of race truth and must not import React or HTTP clients.
- `src/services/` owns external communication and must not mutate race outcomes.
- `backend/main.py` wires HTTP routes; schemas, prompts, and OpenAI execution live in their dedicated backend modules.
- GPT-5.6 explains supplied evidence. It never calculates position, penalties, physics, votes, or score.

Import simulation behavior through `src/simulation/index.ts` from application code. All automated tests live under the root `tests/` directory: `unit/` for Vitest, `backend/` for pytest, and `e2e/` for Playwright. Unit tests under `tests/unit/simulation/` may import concrete simulation modules when verifying internal formulas.

## Change workflow

Keep commits focused and behavior-preserving refactors separate from new features when possible. Update documentation in the same change whenever paths, behavior, setup, or architecture changes.

Minimum verification:

~~~powershell
npm run verify
npm run test:e2e
.venv\Scripts\python.exe -m compileall -q backend
docker compose build
~~~

Also inspect the three circuits in WebGL when changing tracks, scenery, cars, pits, camera behavior, or global styles.

## Pull-request checklist

- The requested behavior works end to end.
- No manual steering, throttle, or braking control was introduced.
- Deterministic formulas have tests.
- GPT payloads remain grounded in current race facts.
- Loading, fallback, and narrow-screen states remain usable.
- README, architecture, calculations, testing, changelog, and checklist are current where relevant.
- Secrets, generated files, and local environments are not committed.
