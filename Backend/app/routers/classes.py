"""
app/routers/classes.py
======================
GET /api/v1/classes — Returns the disease/condition class labels the model predicts.
Used by the frontend to populate probability bars in the Results Panel.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import CLASS_LABELS
from app.models import ClassesResponse

router = APIRouter()


@router.get("/classes", response_model=ClassesResponse)
def list_classes() -> ClassesResponse:
    """Return all class labels supported by the active model."""
    return ClassesResponse(classes=CLASS_LABELS)
