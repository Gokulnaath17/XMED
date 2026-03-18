"""
app/routers/models_router.py
============================
GET /api/v1/models — Returns the list of available models for the UI selector.
"""
from __future__ import annotations

import time

from fastapi import APIRouter

from app.config import MODEL_REGISTRY
from app.errors import ApiError
from app.models import ModelInitResponse, ModelsResponse
from ml.pipeline import preload_model

router = APIRouter()


@router.get("/models", response_model=ModelsResponse)
def list_models() -> ModelsResponse:
    """Return all registered models and their metadata."""
    return ModelsResponse(models=MODEL_REGISTRY)


@router.post("/models/{model_id}/initialize", response_model=ModelInitResponse)
def initialize_model(model_id: str) -> ModelInitResponse:
    """Warm up and cache the requested model (downloads weights if needed)."""
    model_info = next((m for m in MODEL_REGISTRY if m.id == model_id), None)
    if model_info is None:
        raise ApiError(404, "MODEL_NOT_FOUND", "model_id does not exist.")

    start = time.perf_counter()
    was_cached = preload_model(model_id)
    duration = time.perf_counter() - start

    return ModelInitResponse(
        model_id=model_id,
        status="ready",
        was_cached=was_cached,
        duration_seconds=round(duration, 3),
    )
