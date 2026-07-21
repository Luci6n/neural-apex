# Neural Apex Roadmap

This roadmap separates submission work from future ideas. The canonical product requirements remain in `docs/PRD_v2.md`.

## Submission-critical

- Complete a manual visual QA matrix across Spa-, Silverstone-, and Barcelona-inspired circuits.
- Verify main-road and pit-lane geometry never crosses, floats, or places scenery on the racing surface.
- Verify stable side-by-side overtaking without overlap, flashing, or lateral warping.
- Confirm the live OpenAI stream reports `source: openai` with the configured GPT-5.6 key.
- Run and record Docker, E2E, unit, TypeScript, backend, and WebGL checks from a clean checkout.
- Capture final screenshots and a roughly two-minute demo from the private recording checklist.
- Prepare the Devpost description, architecture visual, Codex/GPT usage evidence, and required session ID.

## Post-submission polish

- Split the global visual stylesheet into ordered design-system, setup, race, tutorial, and responsive layers.
- Break the deterministic engine into weather, pace, stewardship, pits, and traffic modules behind the existing public simulation API.
- Add longer-lived experiment history and charts beyond session storage.
- Add scenario-specific presets for tyre overheating and adaptive opponents.
- Improve camera direction and broadcast replay moments.
- Add automated accessibility checks and a broader device matrix.

## Deliberately out of scope

- Manual driving controls
- Real-time multiplayer
- Licensed Formula 1 branding or exact assets
- Full vehicle dynamics or mechanical simulation
- A trained browser ML, DL, or RL pipeline
- Career, finance, staff, contracts, or car-development systems

The product should remain a focused learning experiment: configure, observe, decide, debrief, change one variable, and compare.
