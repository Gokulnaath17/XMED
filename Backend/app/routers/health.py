"""
app/routers/health.py
=====================
GET /api/v1/health — System health check for the top-nav status indicator.

Reports online/processing status, CUDA availability, model load state, and uptime.
"""
from __future__ import annotations

import time
from typing import Optional, Tuple

from fastapi import APIRouter

from app.config import MODEL_REGISTRY
from app.models import HealthResponse

router = APIRouter()

# Module-level start time so uptime is tracked from import (server startup).
_APP_START_TIME: float = time.time()


def _get_cuda_info() -> Tuple[bool, Optional[str], Optional[str]]:
    """Probe PyTorch for CUDA availability and device information."""
    try:
        import torch  # noqa: PLC0415
    except Exception:
        return False, None, None

    cuda_available = bool(torch.cuda.is_available())
    cuda_device = torch.cuda.get_device_name(0) if cuda_available else None
    cuda_version = getattr(torch.version, "cuda", None)
    return cuda_available, cuda_device, cuda_version


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Return system and GPU health status."""
    cuda_available, cuda_device, cuda_version = _get_cuda_info()
    model_loaded = any(m.available for m in MODEL_REGISTRY)
    uptime_seconds = int(time.time() - _APP_START_TIME)

    return HealthResponse(
        status="online",
        cuda_available=cuda_available,
        cuda_device=cuda_device,
        cuda_version=cuda_version,
        model_loaded=model_loaded,
        uptime_seconds=uptime_seconds,
    )
