"""
app/routers/models_router.py
============================
GET /api/v1/models — Returns the list of available models for the UI selector.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import MODEL_REGISTRY
from app.models import ModelsResponse

router = APIRouter()


@router.get("/models", response_model=ModelsResponse)
def list_models() -> ModelsResponse:
    """Return all registered models and their metadata."""
    return ModelsResponse(models=MODEL_REGISTRY)
