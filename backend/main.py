from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
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
    decision: Literal["pit-intermediate", "pit-wet", "stay-out"] | None = None
    race: dict[str, Any] = Field(default_factory=dict)


class DebriefRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    race: dict[str, Any]


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "neural-apex",
        "aiConfigured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/api/explain")
def explain(payload: ExplainRequest) -> dict[str, str]:
    fallback = conflict_fallback(payload.decision)
    result, source = ask_openai(
        instructions=(
            "You are the race engineer in Neural Apex, a beginner autonomous-racing strategy lab. "
            "Explain cause and effect in no more than 100 words. Use plain language. "
            "Avoid formulas, gradients, epochs, layers, and hype. Clearly distinguish "
            "prediction, pattern recognition, and adaptation when relevant. The AI "
            "systems advise; the team principal makes the final strategy decision. "
            "Ground the explanation in the supplied setup and telemetry. Never imply "
            "that the player manually drives the car. Return plain text only: do not "
            "use Markdown markers, headings, or bullet syntax."
        ),
        context=payload.model_dump(),
        fallback=fallback,
    )
    return {"explanation": result, "source": source}


@app.post("/api/debrief")
def debrief(payload: DebriefRequest) -> dict[str, str]:
    fallback = debrief_fallback(payload.race.get("decision"))
    result, source = ask_openai(
        instructions=(
            "You are the post-race learning coach in Neural Apex. Write one concise "
            "paragraph of at most 120 words for a beginner. Cover what the Predictor "
            "expected, what the Pattern Scanner detected, how the Adaptive Driver "
            "changed, how the configured tyre, fuel, or aero setup mattered, and how "
            "the team-principal decision helped or hurt. End with one "
            "plain-language lesson. Explain cause and effect without model-training jargon."
            " Return plain text only: do not use Markdown markers or headings."
        ),
        context=payload.model_dump(),
        fallback=fallback,
    )
    return {"debrief": result, "source": source}


def ask_openai(
    *, instructions: str, context: dict[str, Any], fallback: str
) -> tuple[str, str]:
    if not os.getenv("OPENAI_API_KEY"):
        return fallback, "local-fallback"
    try:
        client = OpenAI()
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=instructions,
            input=json.dumps(context),
            max_output_tokens=280,
        )
        return response.output_text or fallback, "openai"
    except Exception as error:
        print(f"OpenAI request failed: {error}")
        return fallback, "local-fallback"


def conflict_fallback(decision: str | None) -> str:
    if decision in {"pit-intermediate", "pit-wet"}:
        return (
            "You traded a little track position for wet-weather grip. The Predictor "
            "used past wet races, while the Scanner only knew the track was still dry. "
            "Pitting early trusted the forecast before the visible pattern arrived."
        )
    if decision == "stay-out":
        return (
            "You protected track position while the circuit was dry. That followed the "
            "Scanner and Adaptive Driver, but accepted the risk that the Predictor's "
            "rain forecast could become true before your next pit chance."
        )
    return (
        "The Predictor estimates what may happen from past examples. The Scanner watches "
        "what is happening now. The Adaptive Driver changes its next action after "
        "consequences. They disagree because each sees a different part of the race."
    )


def debrief_fallback(decision: str | None) -> str:
    if decision in {"pit-intermediate", "pit-wet"}:
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
