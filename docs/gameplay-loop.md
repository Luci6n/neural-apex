# Gameplay Loop

## Player role

The player is the team principal, strategist, and AI systems operator. Every car drives autonomously.

## Experiment loop

1. Choose learning and session modes.
2. Configure tyre, fuel, aero, weather policy, AI monitoring, adaptive priority, and bots.
3. Review the Predictor’s estimate.
4. Launch the autonomous run.
5. Observe racing line, pace, tyre wear, fuel, grip, detections, and rivals.
6. Send push, hold, or conserve commands.
7. Resolve a paused weather-strategy conflict.
8. Finish and review the five-part debrief.
9. Adjust the setup.
10. Rerun and compare time, position, setup, and decision.

## Runtime state machine

~~~text
Main
  → Tutorial (optional)
  → Setup
  → Preflight prediction
  → Live autonomous run
      ↔ pace command
      → contextual strategy window (soft ≈25%, medium ≈50%, hard ≈75%; weather may trigger earlier)
      → queued pit request (optional)
      → pit entry → limiter → service → exit
      → contact / penalty / DNF (conditional)
  → Result and streamed debrief
  → Setup with previous-run comparison
~~~

| State | Player can do | Simulation continues? |
| --- | --- | --- |
| Setup | Change every scenario input and weather seed | No |
| Racing | Push, Hold, Conserve, open Box menu | Yes |
| Manual box menu | Read live recommendation, select compound, close menu | Yes |
| Strategy window | Compare evidence, ask GPT, pit or stay out | Paused |
| Pit requested | Cancel before entry, change pace | Yes |
| In pit | Observe limiter, service, and exit | Yes |
| Finished or DNF | Read result and debrief | No |

## Scenario

Sudden Rain starts dry. The Scanner detects rear-tyre heat before the surface becomes wet. The Predictor forecasts rain with medium confidence. The Adaptive Driver initially values position. The player chooses whether to pit before visible rain.

Sudden Rain is a framing device, not one fixed outcome. Weather is generated from bounded circuit-specific values and a visible seed. Rain may arrive early, late, or not during a short run.

## Agency

Setup choices and pit-wall commands visibly affect pace, tyre wear, fuel burn, grip, and outcome. The player never steers, accelerates, brakes, or boosts.

### Before launch

- Circuit controls length, topology, elevation, baseline pace, and climate.
- Session changes timing presentation and pace bias.
- Test and qualifying are timed and end when the countdown reaches zero; Race is lap-based. A selected lap cap can end a timed session first.
- Run length controls fuel scaling and the maximum possible strategy windows.
- Tyre, fuel, aero, weather policy, scanner allocation, RL priority, driver style, and rival model enter formulas.

### During the run

- Push trades tyre, fuel, and risk for pace.
- Hold follows the configured plan.
- Conserve protects tyre and fuel while lowering risk.
- Box this lap queues a compound; it does not teleport the car or change the tyre.
- Three-or-more-lap sessions guarantee one tyre-timed contextual review so the ML/DL/RL learning mechanic is visible: soft-family compounds target one-quarter distance, Medium halfway, and hard-family compounds three-quarter distance. Weather may pull it earlier; any later window still requires escalating evidence.
- The autonomous line moves outside, to the apex, and back outside; driver style controls commitment.

### After the run

The result stores setup, seed, position, elapsed plus penalties, best lap, tyre wear, fuel, and decision. The debrief separates:

1. what the Predictor expected;
2. what the Scanner detected;
3. what the Adaptive Driver changed;
4. which team decision helped or hurt;
5. one plain-language lesson.

## Comparison discipline

For a controlled test, retain the seed and change one variable. For variety, choose New forecast. The previous-run card highlights setup and outcome differences so the player can reason about cause instead of chasing an opaque score.

## Failure and recovery

- Major damage can retire the player and create a DNF result.
- Three track-limit violations add five seconds.
- Pit speed above 80 km/h adds five seconds.
- Reloading during a race warns that the unfinished result will be lost.
- Setup and completed result state are session-backed; the active simulation itself is not silently restored.

Exact equations and thresholds are documented in gameplay-calculations.md.
