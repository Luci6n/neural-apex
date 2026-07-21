# Project Structure

Neural Apex uses feature-first frontend organization around a deterministic simulation core and a thin FastAPI language boundary.

## Directory map

~~~text
neural-apex/
├── backend/
│   ├── main.py                 FastAPI routes, health, streaming responses, SPA serving
│   ├── schemas.py              Pydantic request and structured-output schemas
│   ├── prompts.py              Versioned race-engineer and debrief instructions
│   └── race_engineer.py        OpenAI execution, streaming, parsing, and fallbacks
├── docs/assets/screenshots/     Curated judge-facing product captures
├── src/
│   ├── app/
│   │   ├── App.tsx             Route-level orchestration
│   │   ├── navigation.ts       URL/screen mapping
│   │   └── session.ts          Browser-session persistence helpers
│   ├── features/
│   │   ├── intro/              Entry screen and intro 3D scenes
│   │   ├── tutorial/           Visual beginner briefing
│   │   ├── setup/              Experiment configuration
│   │   ├── race/               Race shell, 3D scene, timing tower, pit wall
│   │   └── debrief/            Learning summary and run comparison
│   ├── services/
│   │   └── race-engineer/      Typed FastAPI client and NDJSON parser
│   ├── shared/
│   │   └── ui/                 Reusable AI visuals, circuit map, safe rich text
│   ├── simulation/
│   │   ├── index.ts            Public application-facing simulation API
│   │   ├── engine.ts           Authoritative deterministic race state transitions
│   │   ├── config.ts           Defaults and autonomous grid presets
│   │   ├── tracks.ts           Track profiles, curves, pits, curvature, racing line
│   │   ├── tyres.ts            Compound profiles and helpers
│   │   ├── types.ts            Domain contracts
│   ├── styles/
│   │   └── index.css           Ordered global visual system and responsive overrides
│   └── main.tsx                Browser entrypoint
├── tests/
│   ├── unit/                   Vitest UI, client, simulation, and topology suites
│   ├── backend/                Pytest API, schema, streaming, and fallback suites
│   └── e2e/                    Routed Playwright strategy flows
├── docs/                       Product, architecture, API, gameplay, and QA records
├── CONTRIBUTING.md
├── DESIGN.md
├── ROADMAP.md
└── README.md
~~~

## Dependency direction

~~~text
app → features → shared UI
       │   │
       │   └────→ services → FastAPI
       └────────→ simulation

FastAPI main → schemas + race_engineer → prompts + OpenAI
~~~

The dependencies deliberately point inward toward deterministic race contracts. `simulation/` does not import React, browser storage, fetch, FastAPI, or OpenAI. The FastAPI layer receives snapshots and returns language; it cannot mutate the browser simulation.

## Public boundaries

Application code imports race-domain contracts and functions through `src/simulation/index.ts`. This allows the internal engine to be split further without repeatedly changing every feature. Tests are intentionally independent under `tests/` and mirror the application boundaries.

`src/services/race-engineer/client.ts` is the only browser-side OpenAI-service boundary. It serializes full race context, parses NDJSON status/delta/complete events, and reports the response source.

`backend/main.py` is intentionally small. HTTP concerns stay there; Pydantic contracts stay in `schemas.py`; prompts stay reviewable in `prompts.py`; OpenAI/fallback behavior stays in `race_engineer.py`.

## Placement guide

| New code | Location |
| --- | --- |
| Race formula or state transition | `src/simulation/` plus `tests/unit/simulation/` |
| Feature-only component or 3D scene | Matching `src/features/<feature>/` folder |
| Reusable display component | `src/shared/ui/` |
| Navigation or session behavior | `src/app/` |
| Browser API client behavior | `src/services/` |
| API validation contract | `backend/schemas.py` |
| GPT instruction change | `backend/prompts.py` plus API/E2E verification |
| OpenAI streaming or fallback implementation | `backend/race_engineer.py` |

## Known next refactors

The current structure establishes stable public boundaries. After submission, the large engine and ordered global stylesheet can be divided internally without changing feature imports. Those items are tracked in `ROADMAP.md`; they should not displace final circuit, Docker, demo, and submission QA.
