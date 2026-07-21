# Architecture

Neural Apex is an autonomous race-strategy simulator with a deterministic browser simulation and a thin FastAPI language boundary.

## Client

- React owns setup, pit-wall decisions, tutorial, debrief, and run history.
- React Three Fiber owns the circuit, autonomous cars, rain, camera, and renderer diagnostics.
- The game module owns setup formulas, waypoint movement, telemetry, bot state, scripted learning events, scoring, and comparisons.
- The service module owns typed calls to FastAPI.

No manual-driving input enters the simulation. A RaceConfig and high-level StrategyCommand determine player-car behaviour.

## Simulation flow

RaceConfig includes session, tyre, fuel, aero, weather policy, scanner focus, adaptive priority, difficulty, and bot preset. createRace derives the pre-run prediction and starting telemetry. advanceRace moves every car autonomously, updates racing lines and telemetry, and emits scanner, conflict, weather, adaptation, and finish events.

The decision window pauses time. resolveDecision applies either the wet-tyre pit cost and benefit or the dry-tyre track-position risk. createRunRecord stores setup plus outcome for the next comparison.

## Server

FastAPI:

- loads .env server-side;
- exposes health, explain, and debrief endpoints;
- validates request shapes;
- calls GPT-5.6 through the OpenAI Responses API;
- returns local fallback text on failure;
- serves the built SPA in production.

GPT-generated text cannot mutate the simulation.

## Rendering

Cars use low-poly primitive factories and follow a closed Catmull-Rom path. The camera is an elevated broadcast observation view. Movement is kinematic because repeatable setup-to-outcome relationships matter more than rigid-body realism.

## Runtime

During development, Vite proxies /api to FastAPI. In production, a multi-stage Docker image builds the frontend and FastAPI serves both the SPA and API on port 8787.

