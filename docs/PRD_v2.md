# Product Requirements Document

## Product Name

**Neural Apex**

**Tagline:** Learn AI at racing speed.

## 1. Product Summary

Neural Apex is a beginner-friendly, blocky 3D racing game that teaches the practical differences between Machine Learning, Deep Learning, and Reinforcement Learning through gameplay.

Players manage a racing team, configure AI-assisted race systems, work with a race engineer, and make decisions before and during a race. Instead of teaching formulas, model architecture, gradients, epochs, or other technical details, the game teaches through visible cause and effect.

The core learning model is:

- **Machine Learning predicts**
- **Deep Learning recognises complex patterns**
- **Reinforcement Learning improves decisions through experience**

The game is designed for beginners who are curious about AI but may not have a technical background.

---

## 2. Hackathon Category

**Education**

The product teaches introductory AI concepts through an interactive racing simulation rather than traditional lessons or quizzes.

---

## 3. Problem Statement

Many beginner AI learning tools rely heavily on technical terminology, coding, formulas, and abstract examples.

This makes it difficult for non-technical learners to understand:

- when Machine Learning should be used;
- how Deep Learning differs from regular Machine Learning;
- how Reinforcement Learning improves through repeated interaction;
- why AI recommendations can be uncertain or conflicting;
- why humans still need to make final decisions.

Neural Apex addresses this by embedding these concepts inside a familiar and engaging racing environment.

---

## 4. Target Users

### Primary Users

- Students and beginners exploring AI concepts
- Non-technical learners interested in Machine Learning
- Players who enjoy racing, strategy, and simulation games
- Educators looking for an interactive introduction to AI

### User Characteristics

Users are not expected to understand:

- model architecture;
- gradient descent;
- epochs;
- loss functions;
- neural network layers;
- advanced mathematics;
- programming.

The game should explain concepts using plain language, visual feedback, and gameplay outcomes.

---

## 5. Product Goals

### Primary Goals

1. Teach the practical roles of Machine Learning, Deep Learning, and Reinforcement Learning.
2. Allow players to learn through experimentation rather than lectures.
3. Demonstrate that AI outputs can be uncertain, incomplete, or conflicting.
4. Show how race engineers and teams interpret AI recommendations.
5. Deliver a playable and visually engaging blocky 3D experience.

### Secondary Goals

- Encourage players to compare predictions with real outcomes.
- Reward reasoning and decision quality, not only race position.
- Use GPT-5.6 to generate clear, context-aware explanations.
- Provide a strong post-race educational debrief.

---

## 6. Non-Goals

The MVP will not include:

- manual driving controls;
- realistic racing physics;
- advanced vehicle simulation;
- a full Machine Learning training system;
- a real Deep Learning training pipeline;
- a full Reinforcement Learning training environment;
- realistic Formula 1 licensing or branding;
- a large career mode;
- staff salaries or contracts;
- car development trees;
- multiple championships;
- detailed financial management;
- large-scale multiplayer infrastructure;
- user-generated tracks;
- highly realistic 3D assets.

The AI systems are educational simulations inspired by real AI concepts.

---

## 7. Core Product Concept

The player acts as a team principal, race strategist, and AI systems operator. The cars drive autonomously based on the player’s setup and strategy choices.

Before and during a race, the player works with:

- a driver;
- a race engineer;
- a strategy team;
- a Machine Learning prediction assistant;
- a Deep Learning pattern scanner;
- a Reinforcement Learning adaptive driver or strategy system.

The player receives information from these systems, evaluates recommendations, and makes the final decision.

The core principle is:

> The AI provides information, the team interprets it, and the player decides.

---

## 8. Core Gameplay Loop

1. Select a race scenario.
2. Review circuit and weather conditions.
3. Configure the car setup and race strategy.
4. Review Machine Learning predictions.
5. Assign the Deep Learning assistant to monitor telemetry, track vision, or both.
6. Configure the adaptive driver or strategy priorities.
7. Add bot opponents using a one-click preset.
8. Launch an autonomous test run, qualifying simulation, or race.
9. Observe telemetry, racing lines, detections, and adaptive behaviour.
10. Receive race engineer recommendations during decision windows.
11. Accept, reject, delay, or modify team instructions.
12. Complete the autonomous run.
13. Review the post-race AI debrief.
14. Adjust the setup and run again to compare outcomes.

---

## 9. Learning Systems

### 9.1 Machine Learning: Predictor

#### Purpose

Teach players that Machine Learning uses past examples and structured information to predict future outcomes.

#### Inputs

- air temperature;
- track temperature;
- weather conditions;
- rain probability;
- tyre compound;
- tyre pressure;
- fuel load;
- aerodynamic setup;
- circuit type;
- historical lap performance.

#### Outputs

- expected lap time;
- tyre degradation;
- fuel usage;
- chance of rain;
- probability of completing the race;
- suitable tyre compound;
- expected performance under current conditions.

#### Player Interaction

Players choose which information the Predictor should consider and compare its output with the actual race outcome.

#### Beginner Lesson

> Machine Learning studies previous examples to predict what may happen next.

---

### 9.2 Deep Learning: Pattern Scanner

#### Purpose

Teach players that Deep Learning is useful for recognising complicated patterns in images and continuous sensor data.

#### Track Vision

The Pattern Scanner may detect:

- wet sections of the circuit;
- debris;
- track hazards;
- damaged vehicle parts;
- tyre condition;
- reduced visibility;
- unsafe racing conditions.

#### Telemetry Analysis

The Pattern Scanner may monitor:

- speed;
- throttle;
- braking;
- steering;
- tyre temperature;
- engine temperature;
- driving consistency.

It may identify:

- tyre overheating;
- inefficient braking;
- aggressive driving;
- understeer;
- oversteer;
- inconsistent cornering;
- possible mechanical failure.

#### Player Interaction

The player allocates limited processing attention to:

- track vision;
- telemetry;
- balanced monitoring.

The player does not configure technical neural-network settings.

#### Beginner Lesson

> Deep Learning recognises complicated patterns in images and large streams of information.

---

### 9.3 Reinforcement Learning: Adaptive Driver

#### Purpose

Teach players that Reinforcement Learning improves decisions by trying actions and learning from consequences.

#### Possible Actions

The Adaptive Driver may:

- push;
- conserve tyres;
- defend;
- attempt an overtake;
- pit;
- stay out;
- change tyre compound;
- adjust braking points;
- use a safer racing line;
- save fuel.

#### Team Priorities

Instead of numerical reward values, the player gives understandable instructions:

- prioritise winning;
- avoid collisions;
- protect the tyres;
- conserve fuel;
- defend position;
- take more risks;
- prioritise finishing;
- adapt to changing weather.

#### Behavioural Outcome

The driver changes over repeated laps or attempts.

Examples:

- a speed-focused driver becomes aggressive;
- a safety-focused driver avoids risky overtakes;
- a tyre-focused strategy sacrifices short-term speed;
- a driver slows at a corner where previous crashes occurred.

#### Beginner Lesson

> Reinforcement Learning improves by trying actions and learning from what happens afterward.

---

## 10. Race Engineer and Team System

### 10.1 Race Engineer

The race engineer converts AI outputs into clear recommendations.

Example:

- Predictor: Rain likely in two laps.
- Pattern Scanner: Track still dry.
- Adaptive Driver: Staying out protects track position.
- Race Engineer: “Rain is possible, but the circuit is still dry. We can pit now or wait one lap.”

The player can:

- accept;
- reject;
- delay;
- modify the instruction.

### 10.2 Team Roles

The player team includes:

- Driver
- Race Engineer
- Strategy Team
- Car Setup Team

### 10.3 Team Characteristics

Use only three characteristics:

- Skill
- Risk tolerance
- Trust in AI

### 10.4 Opponent Team Personalities

Opponent teams may use predefined styles:

- Aggressive
- Balanced
- Conservative

These styles affect overtaking, pit timing, tyre conservation, weather response, and willingness to follow AI recommendations.

---

## 11. Confidence and Uncertainty

AI recommendations should not always be presented as certain.

Use simple confidence labels:

- Low
- Medium
- High

Example:

> Rain is likely, but confidence is medium.

The player must decide whether the recommendation is strong enough to act on.

---

## 12. Conflicting AI Recommendations

The systems should sometimes disagree.

Example:

- Machine Learning predicts rain.
- Deep Learning sees that the circuit remains dry.
- Reinforcement Learning prefers staying out.
- The race engineer presents the conflict.
- The player decides.

This demonstrates that AI systems provide different perspectives and cannot always make the final decision alone.

---

## 13. Explain My Decision

GPT-5.6 powers an optional explanation feature.

For the MVP, the highest-value in-race GPT-5.6 moment is the conflicting-recommendation decision window. The Predictor may forecast rain, the Pattern Scanner may still see a dry circuit, and the Adaptive Driver may prefer staying out because overtaking is difficult. GPT-5.6 explains why those views differ using the current setup, telemetry, and race state.

The player can request an explanation of:

- why the race engineer recommended a pit stop;
- why the Predictor expected rain;
- why the Pattern Scanner issued a warning;
- why the Adaptive Driver changed behaviour;
- why two AI systems disagreed.

Responses must:

- use beginner-friendly language;
- refer to the current race situation;
- avoid advanced technical terminology;
- explain cause and effect;
- remain concise.

GPT-5.6 must not select the strategy, control an autonomous car, or change deterministic simulation outcomes. The player remains the team principal and final decision-maker.

---

## 14. 3D Game Design

### 14.1 Visual Style

- Blocky low-poly 3D
- Bright and readable environments
- Simple cars made from geometric shapes
- Clear weather and track-state changes
- Minimal realistic detail
- Strong visual feedback for learning events

### 14.2 Camera

Preferred MVP options:

- broadcast-style track camera;
- elevated strategy camera;
- optional chase camera for observation only;
- optional top-down circuit and telemetry overview.

### 14.3 Race Structure

For the MVP:

- one compact circuit;
- one player-controlled team;
- three to five bot cars;
- one to three laps;
- short race duration;
- simple waypoint-based navigation;
- autonomous arcade-style vehicle movement;
- limited collision logic.

### 14.4 Autonomous Race and Test-Run Interaction

The player does not manually steer or drive the car.

Neural Apex is a strategy, experimentation, and observation game inspired by autonomous racing environments such as AWS DeepRacer and setup-focused motorsport simulation workflows.

The player acts as the team principal, race strategist, and AI systems operator.

Before each run, the player configures:

- car setup;
- tyre compound;
- fuel strategy;
- aerodynamic balance;
- driver or agent priorities;
- ML prediction inputs;
- DL monitoring focus;
- RL-inspired behaviour priorities;
- pit and risk strategy;
- opponent difficulty or bot preset.

After configuration, the player launches an autonomous:

- test lap;
- qualifying simulation;
- short race;
- scenario challenge.

During the run, the car and bots drive automatically.

The player observes:

- lap times;
- racing lines;
- tyre wear;
- fuel usage;
- telemetry;
- AI detections;
- predicted versus actual outcomes;
- adaptive behaviour;
- race engineer recommendations;
- strategic consequences.

The player may make high-level decisions during pauses or decision windows, such as:

- pit now or stay out;
- switch tyre compound;
- increase or reduce aggression;
- conserve tyres;
- defend position;
- prioritise safety;
- respond to changing weather;
- accept or reject the race engineer recommendation.

The player must never be required to manually control steering, throttle, or braking.

#### Core Experiment Loop

1. Choose a scenario.
2. Configure the car and AI systems.
3. Select or generate bot opponents.
4. Start an autonomous test run or race.
5. Observe telemetry and AI behaviour.
6. Make strategic decisions when prompted.
7. Review the outcome.
8. Adjust the setup.
9. Run again and compare results.

#### Autonomous Gameplay Acceptance Criteria

The autonomous race system is complete when:

- the player can launch a run without driving the car;
- cars navigate the circuit automatically;
- setup choices visibly affect performance or behaviour;
- the player can compare at least two runs;
- the game records predicted and actual outcomes;
- strategic decisions can alter the active race;
- the post-race debrief explains why the result changed;
- no steering, throttle, or braking controls are required.

### 14.4 Bot Difficulty

#### Rookie

- slower reactions;
- weaker racing line;
- simple strategy;
- more mistakes.

#### Professional

- balanced speed;
- reasonable strategy;
- moderate adaptation.

#### Adaptive AI

- responds to player behaviour;
- changes risk level;
- adjusts strategy;
- learns from repeated failures within the simulation.

---

## 15. Quick Bot Setup and Presets

The player must be able to add bot competitors without configuring every bot individually.

### 15.1 One-Click Bot Setup

The race setup screen should include simple one-click actions such as:

- Add Rookie Grid
- Add Balanced Grid
- Add Competitive Grid
- Add Adaptive Rivals
- Fill Empty Slots

Selecting a preset should immediately create a complete bot field with predefined cars, personalities, difficulty levels, and strategies.

### 15.2 Preconfigured Bot Presets

Each preset may define:

- number of bots;
- driver difficulty;
- team personality;
- risk tolerance;
- trust in AI;
- tyre strategy;
- overtaking behaviour;
- adaptability;
- car performance range.

Example presets:

#### Casual Race

- three Rookie bots;
- low aggression;
- forgiving pace;
- simple strategy.

#### Standard Race

- four mixed-difficulty bots;
- balanced personalities;
- moderate adaptation.

#### Competitive Race

- five Professional bots;
- stronger racing lines;
- better pit strategy;
- higher pressure on the player.

#### Adaptive Challenge

- three Adaptive AI bots;
- behaviour changes based on player decisions and previous laps.

### 15.3 Optional Advanced Configuration

Players may optionally customise individual bots after selecting a preset.

Advanced controls should remain secondary so a beginner can start a race immediately without understanding every setting.

### 15.4 Bot Creation Experience

The intended interaction is:

1. Choose a race scenario.
2. Click a bot preset.
3. Preview the generated grid.
4. Launch the autonomous test run or race.

The complete process should take only a few seconds.

### 15.5 Bot Setup Acceptance Criteria

The bot setup feature is complete when:

- a player can populate the race grid with one click;
- every preset produces a valid and playable bot lineup;
- the player can start without editing individual bots;
- advanced bot editing remains optional;
- preset selection visibly updates the grid preview;
- the chosen bots retain their assigned difficulty and team personalities during the race.

---

## 16. Multiplayer

### MVP Decision

Real-time multiplayer is not required for the hackathon MVP. The MVP should use bots first.

### Future Support

- private race rooms;
- player-versus-player races;
- team strategy competition;
- cooperative team roles;
- one player as driver and another as race engineer;
- shared championships.

---

## 17. Scenarios

The MVP may include up to three short scenarios.

### Scenario 1: Sudden Rain

Focus:

- Machine Learning prediction;
- uncertainty;
- pit timing;
- conflicting recommendations.

### Scenario 2: Tyre Overheating

Focus:

- Deep Learning telemetry analysis;
- driver behaviour;
- setup adjustment;
- race engineer warnings.

### Scenario 3: Adaptive Opponent

Focus:

- Reinforcement Learning;
- changing race strategy;
- risk and reward;
- repeated behavioural adjustment.

If time is limited, fully implement one scenario and represent the others as previews or roadmap content.

---

## 18. Post-Race Debrief

The post-race debrief is a mandatory MVP feature.

This is the primary GPT-5.6 feature because it turns a completed autonomous run into a personalised learning moment. After every run it must explain:

- what the Machine Learning Predictor expected;
- what the Deep Learning Pattern Scanner detected;
- what the Reinforcement Learning-inspired driver changed;
- which team-principal decision helped or hurt;
- one plain-language lesson.

The deterministic simulation supplies the facts. GPT-5.6 synthesises those facts into concise beginner-friendly coaching. If GPT-5.6 is unavailable, a local fallback must preserve the same five-part structure.

### Prediction Review

- What did the Predictor expect?
- Was the prediction correct?
- What information influenced it?

### Pattern Review

- What did the Pattern Scanner detect?
- Which warning mattered most?
- What happened after the warning?

### Adaptation Review

- How did the Adaptive Driver change?
- What previous outcome influenced the change?
- Did the change improve performance?

### Team Decision Review

- Which recommendation did the player accept?
- Which recommendation did the player reject?
- What was the consequence?

### Learning Summary

Provide one plain-language takeaway for each AI type.

---

## 19. Progression and Scoring

The player should not be judged only by finishing position.

Possible score categories:

- Race result
- Decision quality
- Prediction usage
- Safety
- Team communication
- AI understanding

The player may earn an **Apex Intelligence Score** after each race.

Optional unlocks:

- glossary entries;
- new scenarios;
- new team personalities;
- harder opponents;
- alternative AI assistants.

---

## 20. Beginner-Friendly Design Principles

1. Teach through gameplay events.
2. Avoid technical lectures before the race.
3. Explain concepts immediately after they affect the race.
4. Use plain-language names first.
5. Show technical names as secondary labels.
6. Use cause-and-effect explanations.
7. Keep decisions short and understandable.
8. Reward experimentation and mistakes.

### Player-Facing Names

- Predictor — Machine Learning
- Pattern Scanner — Deep Learning
- Adaptive Driver — Reinforcement Learning

---

## 21. In-App Tutorial and Guided Learning

The application must include an in-app tutorial that allows beginners to learn the controls and AI concepts while playing.

### 21.1 Tutorial Principles

The tutorial should:

- teach one concept at a time;
- use plain language;
- avoid technical formulas and model-training terminology;
- allow players to perform each action instead of only reading instructions;
- connect every explanation to a visible race event;
- remain skippable and replayable.

### 21.2 First-Time Player Flow

Recommended tutorial sequence:

1. Introduce the player as the team principal and race strategist.
2. Explain that the cars drive autonomously.
3. Let the player choose a simple car setup.
4. Explain the Predictor using a weather forecast.
5. Let the player select a tyre and fuel strategy.
6. Introduce the Pattern Scanner during a telemetry or track event.
7. Let the player respond to a race engineer warning.
8. Introduce the Adaptive Driver through a visible behaviour change.
9. Present conflicting recommendations.
10. Let the player make the final strategic decision.
11. Complete a short autonomous guided race.
12. Show a simplified post-race debrief.
13. Let the player change one setting and rerun the scenario.

### 21.3 Contextual Tutorials

Short tutorial prompts should appear when a feature is first encountered.

Examples:

- “The Predictor uses past race information to estimate what may happen.”
- “The Pattern Scanner watches complex signals that are difficult to judge manually.”
- “The Adaptive Driver changes its behaviour based on previous results.”
- “AI systems can disagree. You still make the final decision.”

### 21.4 Tutorial Modes

The application should support:

- Guided Tutorial
- Quick Start
- Free Race
- Replay Tutorial

### 21.5 Beginner Assistance

Optional assistance settings:

- highlighted recommended actions;
- simplified race engineer explanations;
- slower event timing;
- automatic pause during important decisions;
- glossary tooltips;
- one-click bot presets;
- recommended default car setup.

### 21.6 Tutorial Completion

After completing the tutorial, the player should be able to explain:

- that ML predicts from past examples;
- that DL recognises complex patterns;
- that RL adapts from consequences;
- that AI recommendations can be uncertain;
- that humans still make final decisions.

### 21.7 Tutorial Acceptance Criteria

The tutorial feature is complete when:

- first-time players are offered the guided tutorial;
- the tutorial can be skipped and replayed;
- each AI concept is introduced through a player action or race event;
- important tutorial decisions can pause or slow the race;
- the player completes at least one guided race;
- the post-race screen reinforces the three AI concepts in plain language.

---

## 22. Functional Requirements

### 22.1 Pre-Race

The player can:

- select Guided Tutorial, Quick Start, or Free Race;
- select a scenario;
- select difficulty;
- review weather and circuit information;
- adjust a small number of car settings;
- review AI predictions;
- assign the Pattern Scanner;
- configure driver priorities;
- populate the grid using a one-click bot preset;
- preview the generated bot lineup;
- optionally customise individual bots;
- start with recommended default settings without manual configuration.

### 22.2 During Race

The system must:

- run a blocky 3D autonomous race or test session;
- control the player car and bot cars autonomously;
- apply player-selected setup, strategy, and AI priorities;
- display telemetry, racing lines, lap times, and strategic events;
- pause or slow the simulation during important decision windows;
- display race position;
- display basic lap information;
- trigger weather or vehicle events;
- show AI observations;
- show race engineer recommendations;
- allow the player to accept or reject decisions;
- update driver or team behaviour.

### 22.3 Post-Race

The system must:

- show the race result;
- compare predicted and actual outcomes;
- explain Deep Learning detections;
- explain adaptive behaviour;
- review player decisions;
- provide beginner-friendly lessons.

### 22.4 GPT-5.6 Integration

GPT-5.6 should be used in this priority order:

- personalised post-race debriefs;
- explaining conflicting AI recommendations;
- race engineer explanations;
- generating beginner-friendly decision explanations;
- adapting educational feedback to player actions.

GPT-5.6 may also explain individual setup or telemetry events when useful, but it must not own deterministic race simulation, autonomous driving logic, scoring, or strategy outcomes.

---

## 23. Technical Approach

### 23.1 Recommended Frontend

Preferred:

- React
- Three.js
- React Three Fiber
- Vite

Alternative:

- Babylon.js

### 23.2 Game Simulation

Use simplified logic:

- waypoint-based autonomous movement for every car;
- setup-driven pace, tyre, fuel, aero, and racing-line behaviour;
- scripted race events;
- deterministic formulas;
- state-machine bot behaviours;
- lightweight adaptive variables.

### 23.3 Backend

Required for this implementation:

- a thin FastAPI service;
- OpenAI Responses API integration using GPT-5.6;
- GET /api/health;
- POST /api/explain;
- POST /api/debrief.

Most race logic runs client-side. FastAPI exists to protect OPENAI_API_KEY, validate compact race-state payloads, separate language generation from gameplay, and return local fallback explanations when GPT-5.6 is unavailable. The backend must never be required for deterministic autonomous movement or race completion.

### 23.4 Docker and Runtime Requirements

Docker is a mandatory delivery requirement. The submitted project must run through its documented Docker workflow so judges and contributors can launch the application consistently.

Required deliverables:

- a root-level `Dockerfile`;
- a `docker-compose.yml` file if multiple services are used;
- documented environment variables in `.env.example`;
- a single command to start the full application;
- health checks or clear startup verification where practical;
- no machine-specific paths or hidden local dependencies.

Recommended commands:

```bash
docker compose up --build
```

The containerised setup must launch all required services, including the frontend, backend, and any local supporting services. A clean checkout must not require undocumented global packages or manual source-code changes before startup.

### 23.4.1 Docker Acceptance Criteria

The Docker requirement is complete when:

- `docker compose up --build` starts the complete application from a clean checkout;
- all required services become reachable on documented ports;
- `.env.example` contains every required environment variable without secrets;
- the application exposes a clear health or readiness indicator;
- the Docker setup is tested before submission;
- judges can verify the running game using instructions in the README.

The README must include:

- prerequisites;
- Docker setup instructions;
- local non-Docker setup instructions where supported;
- required ports;
- environment-variable configuration;
- troubleshooting guidance;
- a simple verification step confirming the game is running.

### 23.5 Project Documentation

All project documentation must be maintained inside a root-level `docs/` directory while the project is being developed.

### 23.5.1 Optional External Coding Supervisors

Codex may use the following locally installed supervisor skills to delegate suitable coding tasks and reduce direct GPT-5.6 token usage:

- `antigravity-cli-supervisor`  
  Path: `C:\Users\User.codex\skills\antigravity-cli-supervisor\SKILL.md`

- `github-copilot-cli-supervisor`  
  Path: `C:\Users\User.codex\skills\github-copilot-cli-supervisor\SKILL.md`

These skills are optional development accelerators. They may be used for:

- generating repetitive implementation code;
- scaffolding components;
- writing straightforward utility functions;
- creating basic tests;
- producing boilerplate configuration;
- making small refactors;
- assisting with documentation drafts;
- handling low-risk, clearly specified coding tasks.

Codex remains responsible for:

- deciding which tasks are safe to delegate;
- reviewing all generated code;
- ensuring delegated work matches the PRD;
- integrating delegated changes correctly;
- running lint, tests, builds, and Docker verification;
- updating relevant files under `docs/`;
- rejecting low-quality, insecure, or out-of-scope code.

These supervisor skills must not be used as an excuse to skip:

- code review;
- architecture validation;
- security checks;
- documentation;
- testing;
- build verification;
- Docker verification;
- final end-to-end gameplay validation.

Recommended delegation strategy:

1. Codex defines a narrow task with clear inputs, outputs, and file boundaries.
2. Codex delegates the task through one of the supervisor skills.
3. Codex reviews the returned code and diff.
4. Codex runs the relevant tests and production build.
5. Codex fixes integration issues directly.
6. Codex records major implementation decisions in `docs/decisions/`.

Use GPT-5.6 directly for:

- architecture;
- difficult debugging;
- cross-system integration;
- gameplay design decisions;
- AI learning-system logic;
- final repository review;
- ambiguous or high-risk tasks.

Use the supervisor skills primarily for lower-risk implementation work where token savings are meaningful.

Recommended structure:

```text
docs/
├── architecture.md
├── gameplay-loop.md
├── ai-learning-systems.md
├── bot-system.md
├── tutorial-flow.md
├── setup-and-deployment.md
├── testing.md
└── decisions/
```

Documentation should cover:

- product and gameplay architecture;
- ML, DL, and RL educational simulation logic;
- bot behaviour and difficulty presets;
- race engineer and team decision flow;
- API contracts;
- Docker and deployment instructions;
- testing approach;
- major technical and product decisions;
- known limitations and future improvements.

Key implementation decisions should be recorded as short decision notes under `docs/decisions/`.

### 23.5.2 Documentation Acceptance Criteria

Documentation is complete when:

- the root `docs/` directory exists in the submitted repository;
- architecture, gameplay, AI simulation, bot, tutorial, deployment, and testing documentation are present;
- documentation is updated alongside implementation changes;
- setup instructions match the actual Docker workflow;
- major scope or architecture decisions are recorded under `docs/decisions/`;
- known limitations are stated honestly.

### 23.6 Data

Use synthetic or predefined race data. No real Formula 1 datasets are required.

### 23.7 AI Simulation

The educational AI systems do not need to train actual models.

Suggested implementation:

- ML predictions: formulas and weighted inputs;
- DL detections: scenario and telemetry rule triggers;
- RL behaviour: adaptive state updates based on previous outcomes;
- GPT-5.6: explanations and contextual coaching.

The product must clearly describe these as educational simulations.

---

## 24. MVP Scope

The hackathon MVP should contain:

- one blocky 3D circuit;
- one player team;
- three bot opponents;
- one short autonomous race or test run;
- no manual steering, throttle, or braking controls;
- one race engineer;
- one Machine Learning prediction mechanic;
- one Deep Learning telemetry or visual detection mechanic;
- one Reinforcement Learning-inspired adaptive behaviour mechanic;
- one conflicting recommendation event;
- one Explain My Decision interaction;
- one post-race debrief;
- one completed scenario;
- basic difficulty selection;
- one-click bot presets;
- guided in-app tutorial;
- Docker-based startup;
- maintained project documentation under `docs/`;
- optional delegated coding through the configured Antigravity CLI and GitHub Copilot CLI supervisor skills, with Codex review and verification.

---

## 25. Features to Cut From MVP

Do not implement unless the core experience is already complete:

- real-time multiplayer;
- multiple circuits;
- full career mode;
- complex vehicle physics;
- realistic damage;
- detailed pit-stop animations;
- advanced car customisation;
- staff hiring;
- contracts;
- financial systems;
- large progression trees;
- custom tracks;
- voice communication;
- mobile support;
- multiple game modes.

---

## 26. Success Metrics

The MVP is successful when:

1. A beginner can explain the difference between ML, DL, and RL after one race.
2. The player can complete the full loop without external instructions.
3. The blocky 3D race is functional and visually understandable.
4. AI recommendations visibly affect decisions.
5. The post-race debrief explains what happened clearly.
6. Judges can test the project without complicated setup.
7. The demo communicates the concept in under three minutes.

---

## 27. Three-Minute Demo Flow

### 0:00–0:20 — Problem

Explain that most beginner AI education is too technical and abstract.

### 0:20–0:40 — Product Introduction

Show the blocky 3D racing environment and introduce the three AI assistants.

### 0:40–1:10 — Pre-Race Setup

- Review the Predictor output.
- Assign the Pattern Scanner.
- Configure the Adaptive Driver.
- Show the race engineer.

### 1:10–2:10 — Race

- Start the race.
- Trigger changing weather or tyre overheating.
- Show conflicting AI recommendations.
- Let the player make a decision.
- Show bot adaptation.

### 2:10–2:40 — Post-Race Debrief

Show:

- prediction versus outcome;
- detected pattern;
- adaptive behaviour;
- player decision consequence.

### 2:40–3:00 — GPT-5.6 and Codex Usage

Explain:

- GPT-5.6 powers contextual explanations and debriefs;
- Codex was used to build the game systems, 3D interface, simulation, and tests.

---

## 28. Judging Alignment

The project must be evaluated internally against the four official OpenAI Build Week criteria. Each criterion is equally weighted.

### 28.1 Technological Implementation

**Official judging focus:** How thoroughly and skillfully the project uses Codex, whether the code reflects genuine effort, and whether the result is a working, non-trivial implementation.

Neural Apex addresses this through:

- a playable blocky 3D racing environment;
- player and waypoint-driven bot vehicle systems;
- one-click bot grid generation and difficulty presets;
- race-state, lap, position, and event management;
- simulated ML, DL, and RL learning mechanics;
- adaptive bot and race-strategy behaviour;
- GPT-5.6-powered contextual explanations and post-race debriefs;
- local fallback behaviour when GPT-5.6 is unavailable;
- Docker-based reproducible deployment;
- automated tests, production builds, and maintained technical documentation.

Required evidence:

- preserve the primary Codex `/feedback` Session ID;
- document where Codex accelerated implementation;
- document important product and engineering decisions made by the team;
- retain meaningful Git commit history from the submission period;
- include architecture and implementation details under `docs/`;
- demonstrate that the project runs rather than showing only mock-ups;
- ensure the repository contains genuine, understandable, non-trivial code.

Success condition:

> Judges can see that Codex was used throughout a real engineering workflow and that the submitted application is functional, testable, and technically substantial.

### 28.2 Design

**Official judging focus:** Whether the project is working or runnable and provides a complete, coherent product experience rather than only a technical proof of concept.

Neural Apex addresses this through:

- a complete pre-race, race, decision, and post-race flow;
- Guided Tutorial, Quick Start, and Free Race modes;
- beginner-friendly terminology and progressive guidance;
- simple one-click bot presets;
- readable blocky 3D visual design;
- clear race engineer prompts;
- visible consequences for player decisions;
- consistent interaction patterns;
- a post-race learning debrief;
- a Docker workflow that allows judges to launch the application.

Required evidence:

- a judge can start the application from the documented setup;
- a first-time user can begin a race without configuring every system manually;
- at least one scenario is fully playable from beginning to end;
- tutorial prompts and race controls are understandable without external explanation;
- loading, empty, error, and fallback states are handled;
- the demo video shows the actual end-to-end product experience.

Success condition:

> The submission feels like a small but complete game, not a collection of disconnected mechanics or a visual prototype.

### 28.3 Potential Impact

**Official judging focus:** Whether the project makes a credible and specific case for solving a real problem for a real audience, and whether the demonstrated solution actually addresses that problem.

Problem:

- beginner AI education is often abstract, highly technical, or disconnected from practical decisions;
- non-technical learners may struggle to understand when ML, DL, and RL are used and how their roles differ.

Specific audience:

- students and first-time AI learners;
- non-technical users curious about AI;
- educators running introductory AI lessons or workshops;
- racing and strategy-game players who learn better through interaction.

Demonstrated impact:

- users learn ML as prediction from past examples;
- users learn DL as recognition of complex visual and telemetry patterns;
- users learn RL as adaptation from actions and consequences;
- users experience uncertainty and conflicting AI advice;
- users learn that humans still interpret information and make final decisions;
- post-race debriefs connect each AI concept to events the player just experienced.

Required evidence:

- the tutorial explicitly teaches the three distinctions;
- the post-race debrief tests or reinforces understanding;
- the demo follows a beginner completing the learning loop;
- the submission description identifies a specific learner problem and audience;
- optional playtesting feedback is recorded when available.

Success condition:

> After one guided race, a beginner can explain the practical difference between ML, DL, and RL in plain language.

### 28.4 Quality of the Idea

**Official judging focus:** How creative and novel the concept is and how clearly it differs from existing concepts.

Neural Apex differentiates itself through:

- combining blocky 3D racing with beginner AI education;
- teaching AI through strategic consequences rather than lectures or coding exercises;
- representing ML, DL, and RL as separate members of an AI-assisted race team;
- allowing AI systems to disagree;
- using a race engineer to interpret AI outputs;
- preserving the player as the final decision-maker;
- evaluating learning through race decisions and post-race explanations, not only quizzes;
- combining driving, team strategy, AI uncertainty, and explainable decisions in one coherent experience.

Comparable products may teach AI through puzzles, programming, optimisation, or abstract simulations. Neural Apex should clearly communicate that its distinctive contribution is an accessible racing-team environment where AI concepts become visible through predictions, detected patterns, adaptation, and human decisions.

Required evidence:

- explain the concept’s differentiation in the Devpost description;
- avoid presenting the project as merely a racing game with AI labels;
- ensure each AI mechanic changes gameplay and produces a learning outcome;
- show the conflicting-recommendation mechanic in the demo;
- communicate why racing is an effective analogy for AI-assisted decision-making.

Success condition:

> Judges can identify the project’s educational and gameplay novelty within the first part of the demo.

### 28.5 Internal Judging Readiness Checklist

Before submission, confirm:

- [ ] Codex usage is substantial and documented.
- [ ] The primary `/feedback` Session ID is available.
- [ ] The project contains a working, non-trivial implementation.
- [ ] `docker compose up --build` starts the runnable application.
- [ ] One complete scenario works from setup through debrief.
- [ ] The experience feels coherent rather than like a technical proof of concept.
- [ ] The target audience and learning problem are stated specifically.
- [ ] The demo proves that beginners can learn the three AI concepts.
- [ ] The project’s differentiation from existing AI-learning games is explained.
- [ ] The README and `docs/` provide testing and setup guidance.

---

## 29. Risks and Mitigation

### Risk: Excessive Scope

Mitigation:

- use one circuit;
- use one scenario;
- use bots only;
- keep physics simple;
- prioritise the full learning loop.

### Risk: AI Concepts Feel Superficial

Mitigation:

- connect every concept to a visible race event;
- compare predictions with outcomes;
- include a post-race explanation;
- clearly distinguish ML, DL, and RL.

### Risk: 3D Development Takes Too Long

Mitigation:

- use primitive shapes;
- use waypoint movement;
- avoid realistic physics;
- reuse simple low-poly assets;
- keep the race short.

### Risk: GPT-5.6 Latency or Failure

Mitigation:

- include predefined fallback explanations;
- call GPT-5.6 only for high-value moments;
- keep prompts and responses short.

---

## 30. Future Roadmap

- real-time multiplayer;
- cooperative driver and race-engineer mode;
- multiple tracks and weather systems;
- team hiring and management;
- car development trees;
- user-created scenarios;
- classroom mode;
- teacher dashboards;
- longer championships;
- more AI concepts such as classification, recommendation systems, and computer vision;
- voice-based race engineer communication.

---

## 31. Product Pitch

> Neural Apex is a blocky 3D racing strategy game where beginners learn how Machine Learning predicts, Deep Learning recognises patterns, and Reinforcement Learning adapts—by running their own AI-powered race team.
# Implementation addendum — seeded long runs and streamed AI (2026-07-21)

- Runs support 1–32 laps, including 8/16/24/32 presets.
- Guided, Quick Start, and Free Lab share the same physics; Guided adds coaching/policy-line visualization, Quick Start applies a visible balanced preset, and Free Lab minimizes assistance.
- Driver style is separate from RL priority. Cautious/Balanced/Aggressive styles affect local braking, acceleration, overtaking, fuel, tyre wear, track limits, and incident risk.
- Cars calculate speed from local circuit curvature and progressively brake/accelerate.
- Strategy windows are evidence-driven, numbered, spaced, and lap-scaled. Sessions of three laps or more guarantee one compound-timed baseline review: soft family at roughly 25%, Medium at 50%, hard family at 75%, and wet compounds near 33%; weather or grip evidence may pull it earlier. Later windows require escalating evidence. A window may contain agreement or conflict and does not force a pit recommendation.
- Manual Box this lap is always available with any compound, current calculated advice, streamed GPT-5.6 context, and cancellation before pit entry.
- Pit stops use an 80 km/h limiter phase, service-bay hold, tyre fit, and limiter exit.
- All strategy/debrief GPT calls receive the complete relevant race state and return Pydantic-validated output. Streaming endpoints provide visible loading and progressive text. GPT never mutates gameplay.
