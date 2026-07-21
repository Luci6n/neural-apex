from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Iterator, Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
load_dotenv(ROOT / ".env")

app = FastAPI(title="Neural Apex API", version="0.1.0")


class ExplainRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    question: str = Field(min_length=3, max_length=500)
    decision: Literal["pit-dry", "pit-intermediate", "pit-wet", "stay-out"] | None = None
    race: dict[str, Any] = Field(default_factory=dict)


class DebriefRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    race: dict[str, Any]


class SystemVerdict(BaseModel):
    recommendation: Literal["pit", "stay-out"]
    evidence: str = Field(min_length=3, max_length=240)
    confidence: Literal["low", "medium", "high"]


class StrategyAnalysis(BaseModel):
    liveBriefing: str = Field(min_length=3, max_length=1100)
    alignment: Literal["agree-pit", "agree-stay", "conflict"]
    predictor: SystemVerdict
    scanner: SystemVerdict
    adaptiveDriver: SystemVerdict
    engineerSummary: str = Field(min_length=3, max_length=700)
    tradeoff: str = Field(min_length=3, max_length=500)


class DebriefAnalysis(BaseModel):
    liveDebrief: str = Field(min_length=3, max_length=1800)
    prediction: str = Field(min_length=3, max_length=500)
    detection: str = Field(min_length=3, max_length=500)
    adaptation: str = Field(min_length=3, max_length=500)
    teamDecision: str = Field(min_length=3, max_length=500)
    lesson: str = Field(min_length=3, max_length=350)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "neural-apex",
        "aiConfigured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/api/explain")
def explain(payload: ExplainRequest) -> dict[str, Any]:
    fallback = strategy_fallback(payload.race)
    result, source = ask_openai_structured(
        schema=StrategyAnalysis,
        instructions=(
            "You are the live race engineer in Neural Apex. Independently assess the "
            "complete supplied race snapshot and setup. For ML, use forecast probability, "
            "timing, seed, and setup. For DL, use only live track, weather, tyre, grip, "
            "damage, and telemetry evidence. For RL, use the configured objective, current "
            "position, traffic, risk, and consequences. Give each a pit or stay-out "
            "recommendation, then classify whether all three agree or conflict. Do not "
            "invent measurements. Use plain language and keep each field concise. The "
            "systems advise; the team principal makes the final decision."
        ),
        context=payload.model_dump(),
        fallback=fallback,
    )
    return {
        **result,
        "explanation": result["engineerSummary"] + "\n\n" + result["tradeoff"],
        "source": source,
    }


@app.post("/api/explain/stream")
def explain_stream(payload: ExplainRequest) -> StreamingResponse:
    fallback = strategy_fallback(payload.race)
    instructions = (
        "You are the live race engineer in Neural Apex. Independently assess the complete supplied race snapshot and setup. "
        "Write liveBriefing first as a concise two-paragraph plain-language radio briefing. For ML, use forecast probability, timing, seed, and setup. "
        "For DL, use only live track, weather, tyre, grip, damage, and telemetry evidence. For RL, use the configured objective, position, traffic, risk, and consequences. "
        "Give each system a pit or stay-out recommendation and classify agreement. Do not invent measurements. The team principal makes the final decision."
    )
    return StreamingResponse(
        stream_structured_analysis(StrategyAnalysis, instructions, payload.model_dump(), fallback, "liveBriefing", strategy_response),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/debrief")
def debrief(payload: DebriefRequest) -> dict[str, Any]:
    fallback = debrief_structured_fallback(payload.race.get("decision"))
    result, source = ask_openai_structured(
        schema=DebriefAnalysis,
        instructions=(
            "You are the post-race learning coach in Neural Apex. Analyse the complete "
            "supplied final snapshot, setup, race order, event log, weather forecast and "
            "outcome, penalties, damage, tyre, fuel, grip, and team decision. Distinguish "
            "what the Predictor forecast, what the Pattern Scanner observed, and how the "
            "Adaptive Driver changed. Explain how the team decision helped or hurt and "
            "end with one plain-language lesson. Do not invent events or measurements."
        ),
        context=payload.model_dump(),
        fallback=fallback,
    )
    debrief_text = " ".join(result[key] for key in ("prediction", "detection", "adaptation", "teamDecision", "lesson"))
    return {"debrief": debrief_text, "sections": result, "source": source}


@app.post("/api/debrief/stream")
def debrief_stream(payload: DebriefRequest) -> StreamingResponse:
    fallback = debrief_structured_fallback(payload.race.get("decision"))
    instructions = (
        "You are the post-race learning coach in Neural Apex. Analyse the complete final snapshot, setup, order, event log, weather, penalties, damage, tyre, fuel, grip, and decision. "
        "Write liveDebrief first as a concise progressive post-race briefing. Then distinguish Predictor forecast, Pattern Scanner observation, Adaptive Driver change, team decision, and one lesson. "
        "Do not invent events or measurements."
    )
    return StreamingResponse(
        stream_structured_analysis(DebriefAnalysis, instructions, payload.model_dump(), fallback, "liveDebrief", debrief_response),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def stream_structured_analysis(
    schema: type[BaseModel],
    instructions: str,
    context: dict[str, Any],
    fallback: dict[str, Any],
    live_field: str,
    response_builder: Any,
) -> Iterator[str]:
    yield ndjson({"type": "status", "message": "analysing"})
    if not os.getenv("OPENAI_API_KEY"):
        yield from stream_fallback(fallback, live_field, response_builder)
        return
    try:
        client = OpenAI()
        raw = ""
        emitted = ""
        with client.responses.stream(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=instructions,
            input=json.dumps(context),
            text_format=schema,
            max_output_tokens=1000,
        ) as stream:
            for event in stream:
                if getattr(event, "type", "") != "response.output_text.delta":
                    continue
                raw += getattr(event, "delta", "")
                current = partial_json_string(raw, live_field)
                if len(current) > len(emitted):
                    yield ndjson({"type": "delta", "delta": current[len(emitted):]})
                    emitted = current
            final = stream.get_final_response()
        parsed = getattr(final, "output_parsed", None)
        if parsed is None:
            yield from stream_fallback(fallback, live_field, response_builder)
            return
        result = parsed.model_dump()
        live_text = result.get(live_field, "")
        if len(live_text) > len(emitted):
            yield ndjson({"type": "delta", "delta": live_text[len(emitted):]})
        yield ndjson({"type": "complete", "data": response_builder(result, "openai")})
    except Exception as error:
        print(f"OpenAI streaming request failed: {error}")
        yield from stream_fallback(fallback, live_field, response_builder)


def stream_fallback(fallback: dict[str, Any], live_field: str, response_builder: Any) -> Iterator[str]:
    text = fallback[live_field]
    for part in re.findall(r"\S+\s*", text):
        yield ndjson({"type": "delta", "delta": part})
    yield ndjson({"type": "complete", "data": response_builder(fallback, "local-fallback")})


def partial_json_string(raw: str, key: str) -> str:
    match = re.search(r'"' + re.escape(key) + r'"\s*:\s*"((?:\\.|[^"\\])*)', raw)
    if not match:
        return ""
    encoded = match.group(1)
    encoded = re.sub(r'\\(?:u[0-9a-fA-F]{0,3})?$', '', encoded)
    try:
        return json.loads('"' + encoded + '"')
    except json.JSONDecodeError:
        return ""


def ndjson(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


def strategy_response(result: dict[str, Any], source: str) -> dict[str, Any]:
    return {**result, "explanation": result["liveBriefing"], "source": source}


def debrief_response(result: dict[str, Any], source: str) -> dict[str, Any]:
    return {"debrief": result["liveDebrief"], "sections": result, "source": source}


def ask_openai_structured(
    *, schema: type[BaseModel], instructions: str, context: dict[str, Any], fallback: dict[str, Any]
) -> tuple[dict[str, Any], str]:
    if not os.getenv("OPENAI_API_KEY"):
        return fallback, "local-fallback"
    try:
        client = OpenAI()
        response = client.responses.parse(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=instructions,
            input=json.dumps(context),
            text_format=schema,
            max_output_tokens=700,
        )
        parsed = response.output_parsed
        if parsed is None:
            return fallback, "local-fallback"
        return parsed.model_dump(), "openai"
    except Exception as error:
        print(f"OpenAI request failed: {error}")
        return fallback, "local-fallback"


def strategy_fallback(race: dict[str, Any]) -> dict[str, Any]:
    computed = race.get("computedAdvice") or {}
    predictor = computed.get("predictor", "pit")
    scanner = computed.get("scanner", "stay-out")
    driver = computed.get("adaptiveDriver", "stay-out")
    alignment = computed.get("alignment", "conflict")
    return {
        "liveBriefing": "The three systems assess different evidence and time horizons. Compare the forecast, live grip, and the configured objective before making the call. Agreement is not certainty; disagreement exposes a real trade-off that the team principal must resolve.",
        "alignment": alignment,
        "predictor": {"recommendation": predictor, "evidence": f"Forecast is {race.get('forecastRainProbability', 'uncertain')}% around lap {race.get('forecastRainOnsetLap', '?')}.", "confidence": "medium"},
        "scanner": {"recommendation": scanner, "evidence": f"Live rain is {round(float(race.get('rain', 0)) * 100)}% with {round(float(race.get('grip', 0)))}% grip.", "confidence": "medium"},
        "adaptiveDriver": {"recommendation": driver, "evidence": f"The current objective is {race.get('setup', {}).get('priority', 'finish')} with incident risk {race.get('incidentRisk', '?')}%.", "confidence": "medium"},
        "engineerSummary": "The systems use different time horizons: forecast, live evidence, and the next action under the configured objective.",
        "tradeoff": "Following the majority may reduce one risk but agreement is not certainty; the team principal still owns the pit-wall call.",
    }


def debrief_fallback(decision: str | None) -> str:
    if decision in {"pit-dry", "pit-intermediate", "pit-wet"}:
        return (
            "The Predictor expected rain from past races, while the Pattern Scanner first "
            "saw a dry track and rising tyre heat. You pitted before rain became visible, "
            "losing position briefly but gaining wet-weather grip. The Adaptive Driver "
            "then changed its line after rivals responded. Lesson: predictions help you "
            "prepare, detections tell you what is happening now, and adaptation changes "
            "what happens next."
        )
    return (
        "The Predictor expected rain from past races, while the Pattern Scanner still saw "
        "a dry track. You stayed out to protect position, but grip fell when the forecast "
        "became real. The Adaptive Driver changed its line after that consequence. Lesson: "
        "current evidence and predictions answer different questions, so the final "
        "decision still needs human judgment."
    )


def debrief_structured_fallback(decision: str | None) -> dict[str, Any]:
    pitted = decision in {"pit-dry", "pit-intermediate", "pit-wet"}
    return {
        "liveDebrief": "The Predictor estimated what might happen, the Pattern Scanner tracked what was happening, and the Adaptive Driver reacted to the consequences. Your pit-wall decision connected those signals to the final result. Compare this run with the next one by changing a single setup variable.",
        "prediction": "The Predictor estimated rain timing and lap pace from the seeded forecast and starting setup.",
        "detection": "The Pattern Scanner compared live track conditions, tyre heat, and grip with that forecast.",
        "adaptation": "The Adaptive Driver changed pace, line, and braking after grip and traffic consequences appeared.",
        "teamDecision": "The team chose to box for wet-weather grip." if pitted else "The team stayed out to protect track position.",
        "lesson": "Lesson: compare future probability, current evidence, and adaptation before making the final call.",
    }


if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


@app.get("/{path:path}", include_in_schema=False)
def spa(path: str) -> FileResponse:
    if not DIST.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found.")
    requested = (DIST / path).resolve()
    if requested.is_relative_to(DIST) and requested.is_file():
        return FileResponse(requested)
    return FileResponse(DIST / "index.html")
