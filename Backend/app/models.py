"""
app/models.py
=============
All Pydantic request/response schemas shared across the application.
Import from here — never redeclare schemas in routers or services.
"""
from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Shared / generic
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    detail: Optional[Any] = None


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------

class Probability(BaseModel):
    label: str
    probability: float


class AnalyzeResponse(BaseModel):
    id: str
    predicted_class: str
    confidence: float
    probabilities: List[Probability]
    inference_time: float
    heatmap_image: str
    segmentation_image: str
    composite_image: str
    model_id: str
    timestamp: str


# ---------------------------------------------------------------------------
# GET /models
# ---------------------------------------------------------------------------

class ModelInfo(BaseModel):
    id: str
    name: str
    full_name: str
    description: str
    parameters: str
    accuracy: float
    color: str
    available: bool


class ModelsResponse(BaseModel):
    models: List[ModelInfo]


# ---------------------------------------------------------------------------
# GET /classes
# ---------------------------------------------------------------------------

class ClassesResponse(BaseModel):
    classes: List[str]


# ---------------------------------------------------------------------------
# GET /analysis/steps
# ---------------------------------------------------------------------------

class StepInfo(BaseModel):
    id: str
    label: str
    duration_ms: int


class StepsResponse(BaseModel):
    steps: List[StepInfo]


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    cuda_available: bool
    cuda_device: Optional[str]
    cuda_version: Optional[str]
    model_loaded: bool
    uptime_seconds: int


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def model_dump(model: BaseModel) -> dict:
    """Pydantic v1/v2 compatible serialiser."""
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()  # type: ignore[return-value]
