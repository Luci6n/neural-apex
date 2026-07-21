# API Contract

## GET /api/health

Returns ok, service, and aiConfigured. aiConfigured is a boolean and never exposes the key.

## POST /api/explain and POST /api/explain/stream

Request:

    {
      "question": "Why do the systems disagree?",
      "decision": null,
      "race": {
        "lap": 1,
        "rain": 0,
        "tyreWear": 31,
        "activeTyre": "medium",
        "setup": {},
        "predictor": "Rain likely soon",
        "scanner": "Track still dry",
        "adaptiveDriver": "Protect position"
      }
    }

The request contains the complete current race snapshot, setup, racers, event log, penalties, damage, strategy-window number, telemetry, forecast, and deterministic advice. The non-streaming response is validated against `StrategyAnalysis`.

Streaming response uses `application/x-ndjson`:

    {
      "type": "status",
      "message": "analysing"
    }

    { "type": "delta", "delta": "The Predictor..." }

    {
      "type": "complete",
      "data": {
        "alignment": "conflict",
        "predictor": { "recommendation": "pit", "evidence": "...", "confidence": "medium" },
        "scanner": { "recommendation": "stay-out", "evidence": "...", "confidence": "high" },
        "adaptiveDriver": { "recommendation": "pit", "evidence": "...", "confidence": "medium" },
        "explanation": "Beginner-friendly explanation",
        "source": "openai"
      }
    }

## POST /api/debrief and POST /api/debrief/stream

The race object is the complete final snapshot. The validated response separates prediction, detection, adaptation, team decision, and lesson. The streaming variant uses the same status/delta/complete NDJSON protocol.

Both endpoints return deterministic fallback text if GPT-5.6 is missing or fails. Neither endpoint can mutate gameplay.
