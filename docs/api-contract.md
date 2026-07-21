# API Contract

## GET /api/health

Returns ok, service, and aiConfigured. aiConfigured is a boolean and never exposes the key.

## POST /api/explain

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

Response:

    {
      "explanation": "Beginner-friendly explanation",
      "source": "openai"
    }

## POST /api/debrief

The race object includes setup, events, position, elapsed time, best lap, decision, tyre wear, and remaining fuel. The response contains debrief and source.

Both endpoints return deterministic fallback text if GPT-5.6 is missing or fails. Neither endpoint can mutate gameplay.

