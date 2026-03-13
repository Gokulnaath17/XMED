"""
main.py
=======
Application entrypoint — intentionally kept thin.

Responsibilities:
  1. Create the FastAPI application instance.
  2. Register all exception handlers (via app.errors).
  3. Mount the CORS middleware.
  4. Include the aggregated API router (all endpoints under /api/v1).
  5. Expose a bare /healthz liveness probe (outside the versioned prefix).
  6. Optionally run uvicorn when executed directly (python main.py).
"""
from __future__ import annotations

from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_PREFIX
from app.errors import register_error_handlers

# ── Import all routers ────────────────────────────────────────────────────────
from app.routers.analyze import router as analyze_router
from app.routers.models_router import router as models_router
from app.routers.classes import router as classes_router
from app.routers.steps import router as steps_router
from app.routers.health import router as health_router

# ── Application factory ───────────────────────────────────────────────────────
app = FastAPI(
    title="AI-XMED Backend",
    version="2.4.1",
    description="DenseNet121 medical image analysis — chest X-ray classification, "
                "Grad-CAM heatmaps and U-Net segmentation overlays.",
)

# CORS — allow all origins (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_error_handlers(app)

# All versioned API routes under /api/v1
for router in (
    analyze_router,
    models_router,
    classes_router,
    steps_router,
    health_router,
):
    app.include_router(router, prefix=API_PREFIX)

# ── Liveness probe (outside versioned prefix) ─────────────────────────────────
@app.get("/healthz")
def healthz() -> Dict[str, str]:
    """Kubernetes / load-balancer liveness probe."""
    return {"status": "ok"}
from app.routers import debug
app.include_router(debug.router, prefix="/api/v1")

# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
