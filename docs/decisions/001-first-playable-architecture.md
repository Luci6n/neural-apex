# ADR 001: Frontend-First Deterministic Race with Thin FastAPI

Status: Accepted

Date: 2026-07-21

## Context

Neural Apex needs a coherent 3D learning game within a hackathon window. Its value is a repeatable link between AI advice, player choice, and consequence, plus GPT-5.6 explanations without exposing a key.

## Decision

Use React, Vite, Three.js, and React Three Fiber. Keep deterministic autonomous race simulation client-side and use kinematic curve movement instead of rigid-body physics. Player input is limited to setup and high-level strategy.

Use FastAPI for GET /api/health, POST /api/explain, and POST /api/debrief. Call the OpenAI Responses API with compact race facts and provide deterministic fallback text. Fully implement one Sudden Rain scenario, one circuit, and preset bot grids.

## Consequences

Benefits:

- Fast iteration and stable gameplay.
- Repeatable, testable learning events.
- No secret in the frontend.
- GPT failure cannot block a race.
- One container serves SPA and API.

Tradeoffs:

- Vehicle behaviour is arcade-like.
- AI systems are educational simulations.
- Client state is unsuitable for competitive multiplayer.
- Only one scenario is complete in the MVP.

Revisit for multiplayer, realistic physics, persistent progression, or server-authoritative races.
