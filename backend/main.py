from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .race_engineer import analyse_debrief, analyse_strategy, stream_debrief, stream_strategy
from .schemas import DebriefRequest, ExplainRequest


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
load_dotenv(ROOT / ".env")

app = FastAPI(title="Neural Apex API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "neural-apex",
        "aiConfigured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/api/explain")
def explain(payload: ExplainRequest) -> dict[str, Any]:
    return analyse_strategy(payload.model_dump())


@app.post("/api/explain/stream")
def explain_stream(payload: ExplainRequest) -> StreamingResponse:
    return ndjson_stream(stream_strategy(payload.model_dump()))


@app.post("/api/debrief")
def debrief(payload: DebriefRequest) -> dict[str, Any]:
    return analyse_debrief(payload.model_dump())


@app.post("/api/debrief/stream")
def debrief_stream(payload: DebriefRequest) -> StreamingResponse:
    return ndjson_stream(stream_debrief(payload.model_dump()))


def ndjson_stream(events: Any) -> StreamingResponse:
    return StreamingResponse(
        events,
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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
