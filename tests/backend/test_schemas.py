import pytest
from pydantic import ValidationError

from backend.schemas import ExplainRequest, StrategyAnalysis


def test_explain_request_rejects_short_questions_and_unknown_decisions():
    with pytest.raises(ValidationError):
        ExplainRequest(question="no", race={})
    with pytest.raises(ValidationError):
        ExplainRequest(question="Explain this", decision="teleport", race={})


def test_strategy_analysis_requires_valid_alignment_and_system_verdicts():
    valid_verdict = {"recommendation": "pit", "evidence": "Rain is approaching.", "confidence": "medium"}
    analysis = StrategyAnalysis(
        liveBriefing="Prepare for rain.",
        alignment="agree-pit",
        predictor=valid_verdict,
        scanner=valid_verdict,
        adaptiveDriver=valid_verdict,
        engineerSummary="All evidence currently supports a stop.",
        tradeoff="Pitting costs track position.",
    )
    assert analysis.alignment == "agree-pit"

    with pytest.raises(ValidationError):
        StrategyAnalysis(**{**analysis.model_dump(), "alignment": "certain"})
