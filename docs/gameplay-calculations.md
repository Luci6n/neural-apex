# Gameplay Calculations and Experiment Modes

Neural Apex is a reproducible educational race-strategy simulation. Outcomes are calculated from the selected setup and evolving race state; they are not pre-recorded result tables. It is not a rigid-body vehicle simulator and the ML, DL, and RL roles are explainable educational models rather than trained browser models.

## What the three modes change

| Mode | Useful difference | Physics |
| --- | --- | --- |
| Guided | Shows coaching prompts and the cyan RL policy-line overlay; strategy windows explain all three AI viewpoints. | Uses the same simulation formulas as every other mode. |
| Quick Start | Immediately loads an eight-lap balanced baseline: Pro opponents, balanced grid/scanner, finish priority, and balanced driver style. The player may still edit it. | Uses the same formulas after the preset is applied. |
| Free Lab | Removes coaching prompts and the policy-line overlay so the player can read the instruments and compare setups with less interruption. | Uses the same simulation formulas for fair comparisons. |

Mode never secretly makes a car faster. Quick Start changes visible setup values; Guided and Free Lab change teaching/UI assistance.

## Setup-to-outcome matrix

| Input | Calculated effects |
| --- | --- |
| Circuit | Length, baseline pace, local corner curvature, elevation, air/track temperature, humidity, wind, and weather timing bounds. |
| Session | Qualifying receives a small pace bias; test runs are conservative; race timing shows intervals instead of only best laps. |
| Run length | 1–32 laps. Longer runs scale fuel burn and allow more possible strategy windows, but do not force them. |
| C1–C5 tyre | Dry pace, wet pace, wear rate, and temperature sensitivity. Harder compounds trade peak pace for durability. |
| Intermediate / Full Wet | Gain grip with water; overheat and wear on a dry/hot circuit. |
| Fuel load | Light improves pace but starts with less margin; Safe costs pace and carries more reserve. |
| Aero | Speed trim helps straights but is more wind/corner sensitive; Grip trim improves corner/wet confidence. |
| Weather policy | Changes how forecast, live rain, and track position influence pace and the RL recommendation. |
| Scanner allocation | Changes how early the DL Pattern Scanner can detect visual or telemetry evidence. |
| Adaptive priority | Sets the RL objective: finish, tyre life, or winning position. |
| Driver style | Cautious, Balanced, or Aggressive modifies braking response, corner speed, overtaking threshold, fuel use, tyre wear, track-limit risk, and contact risk. |
| Opponent model / grid | Changes rival pace, number of cars, overtaking pressure, and weather response. |
| Live Push / Hold / Conserve | Changes pace, fuel burn, tyre wear, track-limit probability, and incident risk every simulation frame. |

## Formula reference

These equations mirror the implementation in `src/simulation/engine.ts`. They are calibrated for a readable 1–32 lap educational run; they are not an FIA vehicle-dynamics model.

### Shared helpers

~~~text
clamp(x, lo, hi) = min(hi, max(lo, x))
smoothstep(a,b,x) = t²(3-2t), t = clamp((x-a)/(b-a), 0, 1)
seededUnit(seed,salt) =
  abs(sin(seed×12.9898 + score(salt)×78.233)×43758.5453) mod 1
~~~

The same seed and salt always return the same value in [0,1), so a scenario can be replayed.

### Pre-run lap estimate

~~~text
predictedLap =
  1.75×circuitLengthKm
  - 145×tyreDryPace
  + fuel + aero + session + priority + driverStyle
~~~

| Input | Adjustment |
| --- | --- |
| Fuel | Light -0.60; Balanced 0; Safe +0.70 |
| Aero | Top speed -0.35; Balanced 0; Grip +0.30 |
| Session | Qualifying -0.45; Race 0; Test +0.55 |
| Priority | Chase win -0.28; Finish safely 0; Protect tyres +0.30 |
| Driver | Aggressive -0.34; Balanced 0; Cautious +0.42 |

Worked baseline for Ardennes Rise, C3, balanced fuel/aero, Race, Finish safely, Balanced driver:

~~~text
1.75×7.004 - 145×0 = 12.257 seconds
~~~

That is a short gameplay clock used for comparison, not a claim about a real Spa lap time.

### Live pace and corner speed

~~~text
tyrePace = dryPace×(1-rain) + wetPace×rain

straightPace = clamp(
  circuitBase + setupPace + strategyPace
  - wearPenalty - temperaturePenalty - windPenalty
  - pitPenalty - damagePenalty,
  inPit ? 0.018 : 0.062,
  0.112
)

sampledSeverity(p) =
  clamp(acos(dot(tangentBefore,tangentAfter))/1.35, 0, 1)

cornerSeverity =
  max(
    sampledSeverity(progress),
    0.98×sampledSeverity(progress+0.020),
    0.84×sampledSeverity(progress+0.040),
    0.64×sampledSeverity(progress+0.065)
  )

effectiveSeverity =
  clamp((cornerSeverity-0.40)/0.60, 0, 1)^2.05

targetPace =
  straightPace ×
  1.16 ×
  (1 - effectiveSeverity×styleCornerLoss×aeroCornerFactor)

brakeRate = baseBrakeRate + effectiveSeverity×severityBrakeBoost

newPace =
  targetPace < oldPace
    ? max(targetPace, oldPace-brakeRate×dt)
    : oldPace+(targetPace-oldPace)×(1-exp(-dt×accelerationResponse))

displayKph = round(clamp(96 + newPace×2150, 118, 340))
~~~

The tangent sample spans 1.8% of a lap. A shared 1.35-radian reference was calibrated from 1,000 samples on each circuit so the classifier no longer saturates: only the tightest roughly 5–15% of a lap approaches hairpin severity. The 0.40 dead zone keeps gentle sweepers fast, and the 2.05 exponent delays heavy braking until the sampled curve is genuinely sharp. The 1.16 live pace scale changes world-space progress as well as the HUD, so the faster motion is not cosmetic.

| Driver | Corner loss | Base brake rate | Acceleration response |
| --- | ---: | ---: | ---: |
| Cautious | 0.82 | 0.380 | 2.2 |
| Balanced | 0.72 | 0.340 | 2.7 |
| Aggressive | 0.62 | 0.300 | 3.2 |

Grip aero uses a corner factor of 0.86, Balanced 1.0, and Top speed 1.1. Push adds 0.006 straight pace; Conserve subtracts 0.004. Minor damage subtracts 0.006; major damage subtracts 0.09.

The three forward samples extend braking look-ahead to 6.5% of a lap. Their severity weights are 0.99, 0.88, and 0.72, so a genuine hairpin starts influencing the car before turn-in without making a gentle bend behave like a slow corner. Braking uses a bounded linear pace loss, strengthened by a 0.10 severity boost for Balanced/Aggressive and 0.12 for Cautious. At full severity the rates are 0.40, 0.44, and 0.50 pace units per second respectively. This is designed to shed a top-speed-to-hairpin delta over roughly four 50 ms telemetry steps, while still preventing a single-update speed collapse. Cautious brakes hardest and earliest; Aggressive uses the lowest base rate.

### Tyre coefficients and wear

| Compound | Dry pace | Wet pace | Base wear |
| --- | ---: | ---: | ---: |
| C1 | -0.0030 | -0.014 | 1.05 |
| C2 | -0.0015 | -0.013 | 1.20 |
| C3 | 0 | -0.012 | 1.50 |
| C4 | +0.0025 | -0.014 | 1.90 |
| C5 | +0.0040 | -0.016 | 2.35 |
| Intermediate | -0.0060 | +0.004 | 1.75 |
| Full Wet | -0.0100 | +0.006 | 1.45 |

~~~text
wearRate = max(0.55,
  compoundBase + wrongSurface + heat
  + command + priority + driverStyle
)

dryTyreWrongSurface = rain×1.8
wetTyreWrongSurface = max(0, 0.35-rain)×3.8
dryHeatAbove36C = (trackTemp-36)×0.06

newWear = clamp(oldWear + dt×wearRate, 0, 100)
~~~

Push / Conserve contributes +0.90 / -0.55. Chase win / Protect tyres contributes +0.30 / -0.25. Aggressive / Cautious contributes +0.50 / -0.30.

Worked example for C3 on a 40°C dry track with Push, Chase win, and Aggressive:

~~~text
wearRate = 1.50 + (40-36)×0.06 + 0.90 + 0.30 + 0.50
         = 3.44
~~~

### Fuel

~~~text
fuelBurnPerSecond =
  (loadBase + command + driverStyle) × 3/totalLaps

newFuel = clamp(oldFuel - dt×fuelBurnPerSecond, 0, 100)
~~~

| Load | Start | Burn base |
| --- | ---: | ---: |
| Light | 78 | 1.70 |
| Balanced | 90 | 1.45 |
| Safe | 100 | 1.25 |

Push adds 0.35; Conserve subtracts 0.25; Aggressive adds 0.22; Cautious subtracts 0.14.

### Grip

~~~text
dryWeatherGrip = 97 - 46×rain
intermediateGrip = 76 + 18×rain
fullWetGrip = 76 + 22×rain

grip = round(clamp(
  weatherGrip + temperatureEffect + aeroBonus - 0.28×wear,
  22, 100
))
~~~

Grip aero adds 4; Top-speed aero subtracts 3. Wet tyres above 34°C lose (trackTemp-34)×0.7. Dry tyres below 24°C lose (24-trackTemp)×0.8.

### Seeded weather

~~~text
airTemp = circuitAir + (uAir-0.5)×5
trackTemp = circuitTrack + (uTrack-0.5)×9 + 0.45×airShift
humidity = clamp(circuitHumidity + round((uHumidity-0.5)×18), 35, 94)
windKph = clamp(circuitWind + round((uWind-0.5)×11), 3, 32)
rainProbability = round(38 + uProbability×52)
rainWillArrive = uOutcome < rainProbability/100
rainOnset = 0.56 + uOnset×(latestOnset-0.56)
rainPeak = 0.52 + uPeak×0.45
~~~

During the run:

~~~text
growth = smoothstep(onset, onset+0.72, playerProgress)
rain = clamp(growth×peak + sin(elapsed×0.11+seed)×0.035×growth, 0, 1)
trackTemp = baseTrackTemp - 11×rain - 0.018×elapsed
airTemp = baseAirTemp - 2.6×rain + sin(elapsed×0.08+seed)×0.4
humidity = clamp(baseHumidity + 24×rain + sin(elapsed×0.16+seed)×2, 35, 99)
wind = clamp(baseWind + sin(elapsed×0.35+seed)×5 + 4×rain, 2, 38)
~~~

### Incident, contact, and DNF

~~~text
baseRisk = clamp(
  9 + priority + aero + opponents + tyre + policy + scanner + driver,
  3, 39
)

liveRisk = clamp(
  baseRisk + 22×rain
  + 0.35×max(0,75-grip)
  + command
  + 0.18×max(0,wear-60),
  2, 68
)
~~~

Examples: Chase win +6, Competitive rivals +5, C5 +3, Aggressive +7, Protect tyres -2, Grip aero -2, Telemetry scanner -2, Cautious -4. Push adds 8 live points; Conserve subtracts 4.

Contact is evaluated only when two cars are within 0.0045 progress and 0.48 lane units. A deterministic roll must be at or below liveRisk/100. Conditional major-accident probability is:

~~~text
P(major | contact) = 0.18 + 0.34×rain
~~~

Major damage retires the trailing car. The player is subject to the same rule.

### Track limits and pit speed

~~~text
trackLimitRisk =
  0.05 + 0.13×rain
  + (Push ? 0.12 : 0)
  + (TopSpeedAero ? 0.05 : 0)
  + (ChaseWin ? 0.05 : 0)
  + driverStyle

measuredPitKph =
  round(61 + commandUrgency + priorityUrgency + 5×rain + controlError)
~~~

Driver style contributes -0.025 / 0 / +0.08. Pit controlError is a seeded integer from 0 to 22. Push adds 14 km/h, Conserve subtracts 5, and Chase win adds 8. Every third track-limit strike and any pit speed above 80 km/h add five seconds.

The automatic geometric boundary is abs(lane) > 1.04. This is derived from the 3.6-unit road half-width, approximately 1.05-unit car half-width, and 2.35-unit lane scale. The normal racing line (up to 0.84) and passing target (0.92) therefore remain legal.

### Strategy-window eligibility

~~~text
windowCap = laps<=1 ? 1 : min(4, ceil(laps/8)+1)

firstWindow =
  forecast>=66%
  OR rain>=0.08
  OR (scannerAlert AND forecast>=58%)

laterWindow =
  rainWillArrive
  AND (rain >= 0.12 + 0.20×(windowCount-1) OR grip<=72)
~~~

Windows are also suppressed while pitting, after a pit is requested, on wet tyres, after a pit decision, and inside the final quarter-lap.

### Pit phases and tyre change

The stop is queued for the current lap’s 0.90 progress point. Standard duration is 5.1 seconds; Full Wet is 5.4.

~~~text
elapsed ratio 0.00–0.30 -> phase 0.00–0.45, limited entry
elapsed ratio 0.30–0.70 -> phase 0.50, service stop
elapsed ratio 0.70–1.00 -> phase 0.55–1.00, limited exit
~~~

The compound changes only when pit phase reaches 0.46. Clicking Box never changes it immediately.

## Local speed and cornering

The circuit spline is sampled ahead and behind each car. The angle between those tangents becomes a 0–1 corner-severity value. Target speed is reduced as curvature increases, with Grip aero carrying more speed and Speed aero losing more. Each car then blends toward the target with separate braking and acceleration response rates, so it slows into a turn and accelerates out instead of changing speed instantaneously.

Aggressive drivers brake later and recover speed sooner. Cautious drivers use a larger corner margin. Rival behavior uses the selected opponent preset.

## Weather and reproducibility

Each run has a visible seed. Circuit-specific baseline ranges generate air temperature, track temperature, humidity, wind, rain probability, onset, intensity, and whether the forecast becomes rain. The same setup plus the same seed reproduces the scenario; New forecast creates a different bounded seed.

Rain then changes grip, tyre suitability, wear, temperatures, braking, incident risk, and the ML/DL/RL evidence. A high forecast can be a false positive.

## Strategy-window frequency

Strategy windows remain evidence-aware, but sessions of three laps or more guarantee one compound-based baseline review. C4/C5 target 25% race distance, C3 targets 50%, C1/C2 target 75%, and wet compounds target roughly 33%. A real weather or grip trigger may pull the review earlier. The window may conclude that all three systems agree to stay out; it is not a forced pit prompt. Wet tyres on a dry surface can instead produce a C3 recovery option. Further windows occur only after Stay out when rain/grip evidence escalates, keeping the system from becoming repetitive.

The upper bound is one window for a one-lap run, then `min(4, ceil(laps / 8) + 1)`. This is only a cap: pitting, stable evidence, insufficient escalation, minimum spacing, or reaching the final quarter-lap suppresses later windows. Each opened window increments its real per-run number (`01`, `02`, and so on).

At each window the complete current snapshot, setup, racers, events, penalties, damage, forecast, telemetry, and deterministic system votes are sent to FastAPI. GPT-5.6 returns validated structured recommendations and a streamed plain-language briefing. GPT cannot change the race state.

## Pit stops, limiter, and penalties

Box this lap may be called manually at any time or from a strategy window. A compound is queued; the active tyre does not change until the car reaches the service bay. The call may be cancelled before pit entry.

Pit movement has three phases: limiter-controlled entry, a visible service stop, and limiter-controlled exit. The limit is 80 km/h. A pit-speed violation adds five seconds. Three track-limit strikes also add five seconds. Penalties are included in final time and GPT debrief context.

## Contact, damage, and DNF

Faster cars select a stable overtaking side and move gradually around only the nearest car ahead. Cars do not ghost through one another. Close overlap can produce contact based on current risk. Minor contact adds damage and pace loss; a major accident retires the affected car and produces a DNF. The player car is subject to the same model.

Incident risk combines setup risk, driver style, weather, grip, tyre wear, live pace command, aero, opponent pressure, scanner allocation, and objective. Deterministic seeded rolls keep identical experiments comparable.

## AI and calculation boundary

- TypeScript calculates movement, local speed, weather, wear, fuel, grip, traffic, damage, penalties, pit state, positions, and results.
- FastAPI keeps the OpenAI key server-side and sends the complete relevant state to GPT-5.6.
- GPT-5.6 explains evidence during strategy windows and synthesizes the post-race lesson. It does not calculate pace, choose for the player, or alter scores.

Primary implementation: `src/simulation/engine.ts`, `src/simulation/tracks.ts`, and `src/simulation/tyres.ts`. The public application import boundary is `src/simulation/index.ts`. GPT explanations are separated across `backend/main.py`, `backend/schemas.py`, `backend/prompts.py`, and `backend/race_engineer.py`.
