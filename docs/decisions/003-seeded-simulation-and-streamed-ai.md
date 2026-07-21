# ADR 003: Seeded simulation and streamed language analysis

Status: Accepted — 2026-07-21

## Decision

Keep all authoritative race state and results in the deterministic TypeScript simulation. Use seeded circuit-specific weather and deterministic incident rolls so experiments are variable but reproducible. Keep GPT-5.6 behind FastAPI and provide it the complete relevant snapshot for explanation only.

Strategy and debrief responses use Pydantic Structured Outputs. Streaming endpoints emit NDJSON status, text-delta, and final validated payload events so the interface shows visible loading and progressive text without exposing partial JSON.

## Consequences

- The same configuration and seed can be compared honestly.
- GPT failure cannot corrupt, block, or rewrite the race result.
- The UI can distinguish model-generated language from local fallback language.
- Formula changes require deterministic tests; prompt/schema changes require API and browser-flow checks.
- This remains an educational simulation, not trained ML/DL/RL or real vehicle dynamics.
