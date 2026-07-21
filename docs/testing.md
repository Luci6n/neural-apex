# Testing

## Automated

- npm run lint: TypeScript project check
- npm test: deterministic autonomous-simulation tests
- npm run build: production frontend
- npm run test:e2e: two complete strategy runs, live GPT text, and comparison
- docker compose build: clean container build

Unit tests verify autonomous movement without input, decision-window pause and pit consequences, and comparable run records.

The E2E test verifies setup changes, automatic progress, high-level pace command, GPT-5.6 conflict explanation, pit and stay-out choices, debrief cards, setup adjustment, and previous-vs-current comparison.

## API

Health must report configuration without returning a secret. Explain and debrief must return source openai with a working key and local-fallback otherwise.

## Visual QA

The installed Three.js canvas inspector verifies nonblank pixels, console/page errors, drawing buffer, real GPU, and renderer budgets at desktop and mobile viewports.

Latest autonomous snapshots:

- Desktop: 161 calls, 4,074 triangles, 97 geometries, 3 textures
- Mobile: 133 calls, 3,650 triangles, 97 geometries, 3 textures
- Console errors: none
- Page errors: none

## Manual

Complete a natural-speed Guided run, pause/resume, try all three pace commands, test both weather decisions, adjust the setup, and confirm comparison text remains understandable.

