import json

from backend.race_engineer import (
    debrief_structured_fallback,
    partial_json_string,
    strategy_fallback,
    stream_strategy,
)


def test_partial_json_string_decodes_streamed_text_and_tolerates_partial_escape():
    raw = '{"liveBriefing":"Rain soon.\\nTrack still dry.","alignment":"conflict"}'
    assert partial_json_string(raw, "liveBriefing") == "Rain soon.\nTrack still dry."
    assert partial_json_string('{"liveBriefing":"unfinished\\u00', "liveBriefing") == "unfinished"


def test_fallbacks_preserve_deterministic_votes_and_five_part_debrief():
    strategy = strategy_fallback({
        "computedAdvice": {"predictor": "pit", "scanner": "pit", "adaptiveDriver": "stay-out", "alignment": "conflict"},
        "forecastRainProbability": 81,
        "forecastRainOnsetLap": 3,
        "rain": 0.2,
        "grip": 75,
        "incidentRisk": 25,
        "setup": {"priority": "tyres"},
    })
    debrief = debrief_structured_fallback("pit-intermediate")

    assert strategy["predictor"]["recommendation"] == "pit"
    assert strategy["adaptiveDriver"]["recommendation"] == "stay-out"
    assert strategy["alignment"] == "conflict"
    assert set(debrief) == {"liveDebrief", "prediction", "detection", "adaptation", "teamDecision", "lesson"}
    assert "box" in debrief["teamDecision"].lower()


def test_strategy_stream_uses_explicit_local_source_without_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    events = [json.loads(line) for line in stream_strategy({"race": {}})]

    assert events[0]["type"] == "status"
    assert events[-1]["type"] == "complete"
    assert events[-1]["data"]["source"] == "local-fallback"
