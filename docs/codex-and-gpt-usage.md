# How Codex and GPT-5.6 Are Used

This document separates development-time Codex usage from runtime GPT-5.6 usage.

## Codex during development

Codex was used as the primary engineering collaborator across the repository:

### Product interpretation

- Read the PRD and competition requirements.
- Corrected the product direction from manual driving to an autonomous team-principal strategy lab.
- Kept PRD_v2 as the implementation source of truth.
- Converted the learning goal into a setup, observation, intervention, debrief, and rerun loop.

### Skill discovery

Codex used the project’s find-skills workflow to search the public skills catalog for relevant capabilities. It vetted and installed Three.js game-development and React Three Fiber skills, then used the applicable gameplay, UI, graphics, testing, and release guidance.

Premium external asset generators were probed as required by the 3D workflow. Their credentials were unavailable and they were unnecessary for the blocky MVP, so the final scene uses reproducible native Three.js geometry.

Downloaded skill packages are local development tooling. They are excluded from the application repository; skills-lock.json records their source information.

### Architecture and implementation

Codex designed and implemented:

- the React and TypeScript feature structure;
- autonomous setup-driven race formulas;
- waypoint and racing-line movement;
- tyre wear, fuel burn, grip, rain, and pace commands;
- bot presets and lightweight adaptation;
- the React Three Fiber scene and renderer diagnostics;
- setup, pit-wall, conflict, debrief, and comparison UI;
- the thin FastAPI service;
- Docker production packaging;
- unit and browser E2E tests;
- maintained project documentation and architecture decisions.

### Debugging and refactoring

Codex used failing checks as evidence and fixed:

- TypeScript project and CSS typing configuration;
- test discovery leaking into installed skill templates;
- virtual-environment pip/package mismatch;
- state inconsistency after a pit stop;
- ambiguous browser-test selectors;
- missing favicon console errors;
- the obsolete manual-driving model;
- the oversized initial bundle by lazy-loading the 3D scene.

### Verification

Codex ran:

- TypeScript checks;
- deterministic simulation tests;
- production Vite builds;
- a live FastAPI/OpenAI request;
- a two-run Playwright strategy test;
- desktop and mobile WebGL pixel/renderer inspection;
- Docker image build;
- dependency audit and final repository review.

## GPT-5.6 inside the product

GPT-5.6 is used only where natural-language reasoning and explanation add educational value.

### 1. Post-race debrief — primary use

After an autonomous run, the client sends compact deterministic facts:

- selected tyre, fuel, aero, monitoring, and strategy settings;
- predicted lap and weather outlook;
- important telemetry detections;
- adaptive-driver changes;
- team-principal pit decision;
- result, lap time, wear, fuel, and event log.

GPT-5.6 synthesises five ideas:

1. What the Predictor expected.
2. What the Pattern Scanner detected.
3. What the Adaptive Driver changed.
4. Which setup or team decision helped or hurt.
5. One plain-language lesson.

This is valuable because it connects the learning explanation to a run the player just observed.

### 2. Conflicting-recommendation explanation

During the weather decision:

- Machine Learning predicts rain soon.
- Deep Learning still recognises a dry circuit and current tyre heat.
- Reinforcement Learning-inspired strategy prefers staying out to protect position.

The player may ask GPT-5.6 why those recommendations disagree before choosing. The response explains that prediction, recognition, and adaptation use different evidence and answer different questions.

GPT-5.6 explains the trade-off but never selects the action.

### Optional future uses

The same boundary could later support:

- setup-change explanations;
- comparison summaries across more than two runs;
- teacher-mode questions;
- scenario-specific glossary help;
- personalised prompts that ask the learner to explain their reasoning.

These are intentionally secondary to debrief and conflict explanation.

## Runtime boundary

The browser owns all deterministic state and sends compact facts to FastAPI.

FastAPI:

- keeps OPENAI_API_KEY server-side;
- validates payloads;
- calls the OpenAI Responses API;
- defaults to OPENAI_MODEL=gpt-5.6;
- limits response length;
- returns source=openai for successful calls;
- returns source=local-fallback when the key is absent or the request fails.

GPT-5.6 does not:

- steer or control a car;
- calculate movement;
- decide tyre wear or fuel use;
- choose the pit strategy;
- determine position or score;
- mutate the race state.

This keeps the game testable, responsive, safe without a key, and honest about which parts are AI-generated.

## Prompt design

Prompts tell the model to:

- use plain language for beginners;
- explain cause and effect;
- distinguish prediction, pattern recognition, and adaptation;
- ground claims in supplied setup and telemetry;
- avoid formulas and model-training jargon;
- stay concise;
- preserve the player as final decision-maker;
- never imply that the player manually drives.

## Fallback design

Both language endpoints have deterministic fallback copy with the same educational intent. A failed or slow OpenAI request cannot block:

- launching a run;
- resolving the strategy window;
- finishing the race;
- reading the learning summary;
- adjusting the setup and rerunning.

## Evidence for judges

Verified runtime evidence:

- /api/health reported aiConfigured=true without exposing a key.
- /api/explain returned HTTP 200, source=openai, and non-empty text.
- Playwright completed two autonomous runs and observed GPT-5.6 labels in both the conflict explanation and post-race coach.
- Local fallback paths remain implemented in FastAPI and the browser.

Repository evidence:

- backend/main.py contains the server-side Responses API integration.
- src/services/raceEngineer.ts contains the client API boundary.
- src/features/race/RaceExperience.tsx contains the conflict interaction.
- src/features/debrief/DebriefScreen.tsx contains the post-race coaching flow.
- tests/e2e/race-flow.spec.ts proves the integrated path.

## Competition submission note

The Devpost submission requires evidence of Codex usage. Before submitting:

1. Run the primary Codex /feedback command for this build session.
2. Save the returned Session ID.
3. Paste it into the required submission field.
4. Link this document from the README and Devpost project description where useful.

Session ID: add after running /feedback.

