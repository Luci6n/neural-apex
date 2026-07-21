from __future__ import annotations

import json
import os
import re
from typing import Any, Iterator

from openai import OpenAI
from pydantic import BaseModel

from .prompts import (
    DEBRIEF_INSTRUCTIONS,
    DEBRIEF_STREAM_INSTRUCTIONS,
    STRATEGY_INSTRUCTIONS,
    STRATEGY_STREAM_INSTRUCTIONS,
)
from .schemas import DebriefAnalysis, StrategyAnalysis


def analyse_strategy(context: dict[str, Any]) -> dict[str, Any]:
    fallback = strategy_fallback(context.get("race", {}))
    result, source = ask_openai_structured(
        schema=StrategyAnalysis,
        instructions=STRATEGY_INSTRUCTIONS,
        context=context,
        fallback=fallback,
    )
    return {
        **result,
        "explanation": result["engineerSummary"] + "\n\n" + result["tradeoff"],
        "source": source,
    }


def stream_strategy(context: dict[str, Any]) -> Iterator[str]:
    race = context.get("race", {})
    return stream_structured_analysis(
        StrategyAnalysis,
        STRATEGY_STREAM_INSTRUCTIONS,
        context,
        strategy_fallback(race),
        "liveBriefing",
        strategy_response,
    )


def analyse_debrief(context: dict[str, Any]) -> dict[str, Any]:
    race = context.get("race", {})
    fallback = debrief_structured_fallback(race.get("decision"))
    result, source = ask_openai_structured(
        schema=DebriefAnalysis,
        instructions=DEBRIEF_INSTRUCTIONS,
        context=context,
        fallback=fallback,
    )
    debrief_text = " ".join(result[key] for key in ("prediction", "detection", "adaptation", "teamDecision", "lesson"))
    return {"debrief": debrief_text, "sections": result, "source": source}


def stream_debrief(context: dict[str, Any]) -> Iterator[str]:
    race = context.get("race", {})
    return stream_structured_analysis(
        DebriefAnalysis,
        DEBRIEF_STREAM_INSTRUCTIONS,
        context,
        debrief_structured_fallback(race.get("decision")),
        "liveDebrief",
        debrief_response,
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
    encoded = re.sub(r"\\(?:u[0-9a-fA-F]{0,3})?$", "", encoded)
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
