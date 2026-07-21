# Testing

## Automated

| Command | Purpose |
| --- | --- |
| npm run lint | TypeScript project check |
| npm test | Vitest UI, API-client, simulation, and circuit topology suite |
| npm run test:backend | Pytest FastAPI endpoint, schema, streaming, and fallback suite |
| npm run test:all | Frontend and backend automated suites |
| npm run build | Production frontend and lazy 3D chunks |
| npm run test:e2e | Route, race, strategy, streaming, pit, debrief, and comparison flow |
| python -m compileall -q backend | Compile every FastAPI/schema/prompt/service module |
| docker compose build | Reproducible full-stack container |

## Unit and topology matrix

| Area | Required assertions |
| --- | --- |
| Movement | Cars progress without input; speed changes with curvature; racing line leaves centre but remains in bounds |
| Setup | Tyre/fuel/aero/session/priority/style change predicted pace or risk |
| Weather | Same seed reproduces; new seed varies; rain changes temperatures/humidity/grip |
| Strategy | Multi-lap runs receive one compound-timed review; numbered escalation works; votes can agree or conflict |
| Pit | Request queues; cancel works before entry; tyre changes only at service; limiter and penalty are recorded |
| Traffic | Stable passing side; separation; minor damage; major retirement and player DNF |
| Stewards | Three limits add five seconds; pit speed over 80 adds five seconds; final time includes penalties |
| Circuits | Raw centre, spline, road edges, pit lane, and pit service segment remain non-crossing |
| Records | Completed setup and outcome can be compared on the next run |
| Shared UI | Model text is safely structured and HTML is escaped |
| Service client | Full context is posted; NDJSON deltas/completion/errors are handled |
| App shell | Public routes and QA hooks map to the intended screens |

## Backend matrix

| Area | Required assertions |
| --- | --- |
| Health | Readiness and AI configuration are reported without exposing a secret |
| Schemas | Invalid questions, decisions, alignment, and structured verdicts are rejected |
| Explain | Deterministic votes and supplied measurements survive the local fallback path |
| Debrief | All five learning sections remain present |
| Streaming | Status appears first, deltas precede completion, and source is explicit |
| Parsing | Partial streamed JSON strings decode without crashing |

## End-to-end flows

The Playwright suite covers:

1. main → tutorial → setup route behavior;
2. a complete autonomous run with a queued pit and service-bay tyre change;
3. streamed race-engineer explanation and post-race debrief;
4. setup adjustment and previous/current comparison;
5. a second stay-out run;
6. responsive strategy-window layout and AI-rail/telemetry separation.

Latest automated result: 57/57 Vitest assertions, 8/8 pytest checks, and 3/3 Playwright flows pass.

## API

Health must report configuration without returning a secret. Explain and debrief return source openai with a working key and local-fallback otherwise.

Streaming verification checks:

- first event communicates status;
- one or more delta events arrive before completion;
- complete carries a schema-valid payload;
- alignment and per-system verdicts match allowed values;
- no secret appears in response or client bundle;
- every request includes current setup, race, weather, evidence, racers, penalties, and decisions.

## Visual QA

The installed Three.js canvas inspector verifies nonblank pixels, console/page errors, drawing buffer, real GPU, and renderer budgets at desktop and mobile viewports.

Latest autonomous snapshots:

- Desktop: 161 calls, 4,074 triangles, 97 geometries, 3 textures
- Mobile: 133 calls, 3,650 triangles, 97 geometries, 3 textures
- Console errors: none
- Page errors: none

The final visual matrix must include all three circuits and:

- tyre contact at flat road, incline, crest, and pit lane;
- no tree, building, grandstand, or pit complex on road;
- no instanced-tree flicker with shadows left behind;
- no curb/pit ribbon crossing or z-fighting;
- natural straight, sweeper, medium-corner, and hairpin speeds;
- smooth outside–apex–outside line;
- no normal car overlap or left/right warp;
- intro at 1680×900, setup desktop/tablet, race desktop/mobile;
- strategy window with long streamed text at narrow height.

## Manual

Complete a natural-speed Guided run, pause/resume, try all three pace commands, call and cancel Box, complete a pit stop, test agreement/conflict/stay-out paths, trigger a penalty, adjust the setup, and confirm comparison text remains understandable.

## Release gate

A release is ready only when:

- lint, unit/topology tests, build, backend compile, and E2E pass;
- live OpenAI streaming is verified when a key is configured;
- Docker builds;
- screenshots pass the visual matrix;
- README verification counts match the latest run;
- PRD, architecture, API, calculations, tutorial, AI, design, changelog, and checklist match shipped behavior.
