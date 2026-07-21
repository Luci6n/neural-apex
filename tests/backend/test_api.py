import json

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_reports_configuration_without_a_secret(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "service": "neural-apex", "aiConfigured": False}
    assert "key" not in response.text.lower()


def test_explain_endpoint_returns_grounded_local_fallback(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post(
        "/api/explain",
        json={
            "question": "Why do they disagree?",
            "decision": None,
            "race": {
                "forecastRainProbability": 72,
                "forecastRainOnsetLap": 2,
                "rain": 0,
                "grip": 92,
                "incidentRisk": 18,
                "setup": {"priority": "finish"},
                "computedAdvice": {
                    "predictor": "pit",
                    "scanner": "stay-out",
                    "adaptiveDriver": "stay-out",
                    "alignment": "conflict",
                },
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "local-fallback"
    assert body["alignment"] == "conflict"
    assert body["predictor"]["recommendation"] == "pit"
    assert "72%" in body["predictor"]["evidence"]


def test_stream_endpoint_emits_status_deltas_and_complete(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post(
        "/api/debrief/stream",
        json={"race": {"decision": "stay-out", "eventLog": ["Stayed out"]}},
    )

    assert response.status_code == 200
    events = [json.loads(line) for line in response.text.splitlines() if line]
    assert events[0] == {"type": "status", "message": "analysing"}
    assert any(event["type"] == "delta" for event in events)
    assert events[-1]["type"] == "complete"
    assert events[-1]["data"]["source"] == "local-fallback"
    assert set(events[-1]["data"]["sections"]) >= {"prediction", "detection", "adaptation", "teamDecision", "lesson"}
