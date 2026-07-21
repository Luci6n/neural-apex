# AI Learning Systems

Neural Apex uses three explainable educational system roles. They are deterministic models that teach different AI problem frames; they are not browser-hosted trained ML, DL, or RL networks.

## Evidence pipeline

~~~text
Seed + circuit + setup
        │
        ├─ Predictor: future probability and expected outcome
Live telemetry + visual state
        ├─ Pattern Scanner: present pattern and anomaly
State + objective + consequences
        └─ Adaptive Driver: next autonomous action
                     │
                     ├─ deterministic vote
                     ├─ player decision
                     └─ GPT evidence synthesis
~~~

## Predictor — Machine Learning role

### Reads

- circuit climate baseline;
- visible weather seed;
- setup and compound;
- run length;
- prior scenario-style coefficients.

### Produces

- predicted lap time;
- rain probability;
- expected rain onset and peak;
- confidence label;
- fuel and tyre-risk framing.

### Lesson

A prediction describes what may happen next. Probability is not certainty: a high-confidence forecast can still be a seeded false positive.

### Visual

An orange forecast curve shows probability and onset. The percentage and confidence label remain visible beside the chart.

## Pattern Scanner — Deep Learning role

### Reads

- current rain and track surface;
- tyre heat/wear trend;
- grip;
- live telemetry;
- configured scanner allocation.

### Produces

- the first meaningful detection point;
- a live evidence statement;
- a pit or stay-out vote derived from current risk.

### Scanner allocation

| Allocation | Behavior |
| --- | --- |
| Vision | Waits for more visible surface evidence. |
| Balanced | Combines early visual and telemetry signals. |
| Telemetry | Detects a trend earlier when forecast confidence is already meaningful. |

### Lesson

Recognition answers what is happening now. It may contradict a future forecast without either system being broken.

### Visual

A cyan sensor grid highlights the currently detected region/channel.

## Adaptive Driver — Reinforcement Learning role

### Reads

- configured objective: Finish safely, Protect tyres, or Chase win;
- driver style and aero;
- grip, rain, wear, traffic, damage, and penalties;
- previous state-action consequences.

### Produces

- local braking and acceleration response;
- outside–inside–outside racing-line target;
- tyre-conservation or pace behavior;
- a pit or stay-out vote consistent with the objective.

### Lesson

RL-style behavior connects state, action, consequence, and the next action. An objective can be rational locally while conflicting with a different future risk.

### Visual

A violet state/action node path highlights the latest adaptation.

## Agreement model

The systems are evaluated independently:

| Alignment | Meaning |
| --- | --- |
| agree-pit | All three votes are pit. |
| agree-stay | All three votes are stay out. |
| conflict | At least one vote differs. |

The app does not force disagreement. Strategy-window title, question, GPT prompt, and button copy reflect the calculated alignment.

Example conflict:

- Predictor: rain probability exceeds the forecast threshold.
- Scanner: the surface is still dry and current grip is manageable.
- Adaptive Driver: staying out protects track position under the configured objective.

Example agreement:

- Predictor: rain is likely.
- Scanner: live rain or telemetry risk has crossed its threshold.
- Adaptive Driver: the finish objective now favours wet grip.

Exact thresholds are documented in gameplay-calculations.md.

## GPT-5.6 race engineer

GPT is an explanation layer, not a fourth control system.

Every strategy request includes:

- full setup and weather seed;
- live lap/progress, position, speed, grip, wear, fuel, temperatures, humidity, wind, and rain;
- all racers, tyres, pit/damage/retirement states;
- penalties and event log;
- Predictor, Scanner, and Adaptive Driver votes;
- prior strategy decisions;
- available player actions.

FastAPI requests a validated structured response and streams the briefing text progressively. The final structure contains alignment, one verdict per system, a summary, and the tradeoff.

The post-race request receives the completed state and returns prediction, detection, adaptation, team-decision, and lesson sections.

GPT cannot:

- change a vote;
- trigger a strategy window;
- alter pace, damage, penalties, position, or score;
- issue a pit request without the player;
- read the OpenAI key from the browser.

If the OpenAI request fails, the API returns an explicit local-fallback source with the same educational structure. It is not silently presented as GPT output.

## Honest model boundary

The simulation demonstrates the conceptual division of AI responsibilities and the human factors of conflicting evidence. It does not claim learned weights, real-world telemetry training, FIA-grade prediction accuracy, or safety-critical autonomy.
