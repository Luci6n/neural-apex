# ADR 002: Autonomous Strategy and Experiment Loop

Status: Accepted

Date: 2026-07-21

## Context

The product fantasy is running an AI race team, not manually driving. Steering and boost distract from setup experimentation and make the AI lesson less clear.

## Decision

Every car, including the player team’s car, moves autonomously. Player agency comes from pre-run configuration, high-level pace commands, paused strategic decisions, and rerun comparison.

The setup must influence pace, wear, fuel, grip, and racing line. Completed runs retain comparable setup and outcome data in browser memory.

## Consequences

- The game communicates its AI-learning purpose more clearly.
- Setup and telemetry become primary UI surfaces.
- E2E tests can verify autonomous progress without keyboard input.
- Kinematic movement remains sufficient.
- Persistent history and richer experiment graphs remain future work.

