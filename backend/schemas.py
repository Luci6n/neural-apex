from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


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
