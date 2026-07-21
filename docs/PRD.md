# Neural Apex Product Requirements

The current implementation source of truth is [PRD_v2.md](PRD_v2.md).

## Critical gameplay correction

Neural Apex is an autonomous race-strategy and experimentation game.

- The player is the team principal, strategist, and AI systems operator.
- The player configures tyres, fuel, aero, AI priorities, monitoring, bot grid, and race strategy.
- Every car drives autonomously.
- The player observes racing lines, telemetry, wear, fuel, detections, and adaptation.
- Player input is limited to setup, high-level pit-wall commands, and strategic decision windows.
- There are no steering, throttle, braking, or boost controls.
- A completed run can be adjusted and rerun for direct comparison.

## Backend and GPT-5.6

The project uses a thin FastAPI backend for health, conflicting-recommendation explanations, and post-race debriefs.

GPT-5.6 is prioritised for:

1. A five-part post-race debrief covering prediction, detection, adaptation, team consequence, and one lesson.
2. On-demand explanations of why the AI systems disagree.

Deterministic simulation owns every race fact and outcome. GPT-5.6 explains those facts and never controls a car or chooses the strategy. Local fallback text keeps the learning loop playable without the API.

Read [PRD_v2.md](PRD_v2.md) for all product, functional, technical, judging, Docker, and acceptance requirements.

