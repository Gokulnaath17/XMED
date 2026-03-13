"""
app/routers/steps.py
====================
GET /api/v1/analysis/steps — Returns pipeline step definitions used by the
animated progress UI in the frontend while inference is running.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import ANALYSIS_STEPS
from app.models import StepsResponse

router = APIRouter()


@router.get("/analysis/steps", response_model=StepsResponse)
def list_steps() -> StepsResponse:
    """Return the ordered list of inference pipeline steps."""
    return StepsResponse(steps=ANALYSIS_STEPS)
