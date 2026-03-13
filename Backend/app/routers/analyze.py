"""
app/routers/analyze.py
======================
POST /api/v1/analyze — Main inference endpoint.

Validates the uploaded image, delegates to the real ml.pipeline for inference,
and returns the full AnalyzeResponse.
"""
from __future__ import annotations

import io
import time

from fastapi import APIRouter, File, Form, UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import ALLOWED_CONTENT_TYPES, MAX_IMAGE_BYTES
from app.errors import ApiError
from app.models import AnalyzeResponse

router = APIRouter()


def _utc_timestamp() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    image: UploadFile = File(...),
    model_id: str = Form(...),
) -> AnalyzeResponse:
    """
    Run full inference pipeline on an uploaded chest X-ray image.

    - Validates content-type, file size, and image integrity.
    - Delegates to the real ML pipeline (ml.pipeline.run_inference).
    - Returns the full AnalyzeResponse matching the frontend API contract exactly.
    """
    from app.config import MODEL_REGISTRY

    # ── Model validation ──────────────────────────────────────────────────────
    model_info = next((m for m in MODEL_REGISTRY if m.id == model_id), None)
    if model_info is None:
        raise ApiError(404, "MODEL_NOT_FOUND", "model_id does not exist.")
    if not model_info.available:
        raise ApiError(503, "MODEL_UNAVAILABLE", "Model is loading or unavailable.")

    # ── Content-type validation ───────────────────────────────────────────────
    if image.content_type and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise ApiError(400, "INVALID_IMAGE", "Uploaded file is not a valid image or is corrupted.")

    # ── Read bytes ────────────────────────────────────────────────────────────
    data = await image.read()

    if not data:
        raise ApiError(400, "INVALID_IMAGE", "Uploaded file is not a valid image or is corrupted.")
    if len(data) > MAX_IMAGE_BYTES:
        raise ApiError(400, "IMAGE_TOO_LARGE", "File exceeds maximum allowed size.")

    # ── Verify image integrity ────────────────────────────────────────────────
    try:
        opened = Image.open(io.BytesIO(data))
        opened.load()
    except (UnidentifiedImageError, OSError):
        raise ApiError(400, "INVALID_IMAGE", "Uploaded file is not a valid image or is corrupted.")

    if opened.format not in {"JPEG", "PNG"}:
        raise ApiError(400, "INVALID_IMAGE", "Uploaded file is not a valid image or is corrupted.")

    # ── Inference ─────────────────────────────────────────────────────────────
    try:
        from ml.pipeline import run_inference
        result = run_inference(data, model_id)
        return AnalyzeResponse(**result)

    except ApiError:
        raise
    except Exception as exc:
        raise ApiError(500, "INFERENCE_FAILED", f"Internal inference error: {exc}") from exc
