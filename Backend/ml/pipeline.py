"""
ml/pipeline.py
==============
Top-level inference orchestrator.

run_inference(image_bytes) is the single entry point called by the /analyze
router.  It:
  1. Lazily loads models on first call (singleton pattern).
  2. Runs the full pipeline in order: preprocess → classify → grad-cam →
     segment → visualise.
  3. Returns a dict that exactly matches the AnalyzeResponse schema so the
     router can unpack it directly.

Follows the notebook implementations for data flow:
  - Classification uses raw model outputs (no sigmoid).
  - GradCAM uses aug_smooth + eigen_smooth on denseblock4.
  - Segmentation interpolates tensor to 512×512, uses > 0.5 threshold,
    returns multi-channel binary masks.
  - Visualization uses contour-based overlays and show_cam_on_image.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

from threading import Lock

from ml.model_loader import load_model
from ml.preprocessing import preprocess_image
from ml.inference import run_classification
from ml.gradcam import generate_gradcam
from ml.segmentation import run_segmentation
from ml.visualization import (
    generate_gradcam_overlay,
    generate_segmentation_overlay,
    generate_anatomy_cam,
    generate_composite,
)

# ---------------------------------------------------------------------------
# Model singleton
# ---------------------------------------------------------------------------
_models_cache: dict = {}
_models_lock: Lock = Lock()


def get_models(model_id: str) -> dict:
    """Return the cached model dict, loading on first call."""
    global _models_cache
    if model_id in _models_cache:
        return _models_cache[model_id]
    with _models_lock:
        if model_id not in _models_cache:
            _models_cache[model_id] = load_model(model_id)
    return _models_cache[model_id]


def preload_model(model_id: str) -> bool:
    """Ensure model is loaded; return True if it was already cached."""
    if model_id in _models_cache:
        return True
    get_models(model_id)
    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_inference(image_bytes: bytes, model_id: str = "densenet121-res224-all") -> dict:
    """
    Execute the full DenseNet121 + Grad-CAM + PSPNet pipeline.

    Args:
        image_bytes: Raw bytes of a JPEG or PNG chest X-ray.
        model_id:    Model identifier for classification.

    Returns:
        Dict matching the frontend AnalyzeResponse schema.
    """
    models = get_models(model_id)
    classifier = models["classifier"]
    segmentation_model = models["segmentation"]
    device = models["device"]

    start = time.perf_counter()

    # ── Step 1 — Preprocess ───────────────────────────────────────────────────
    tensor = preprocess_image(image_bytes)          # [1, 1, 224, 224] CPU tensor
    xray_np = tensor.numpy()                        # keep numpy copy for visualisation

    # ── Step 2 — Classification ───────────────────────────────────────────────
    classification = run_classification(tensor, classifier, device)

    # Top class index for GradCAM (already resolved in inference.py)
    top_index = classification["top_index"]
    predicted_class = classification["predicted_class"]

    # ── Step 3 — Grad-CAM ─────────────────────────────────────────────────────
    cam_results = generate_gradcam(tensor, classifier, device, top_index)
    gradcam_heatmap = cam_results["gradcam"]        # [224, 224] float32
    # gradcampp_heatmap = cam_results["gradcampp"]  # available if needed

    # ── Step 4 — Segmentation ─────────────────────────────────────────────────
    seg_results = run_segmentation(tensor, segmentation_model, device)
    seg_masks = seg_results["masks"]                # [num_classes, 224, 224] uint8
    seg_targets = seg_results["targets"]            # list of organ names

    # ── Step 5 — Visualisation ────────────────────────────────────────────────
    heatmap_image = generate_gradcam_overlay(xray_np, gradcam_heatmap)

    segmentation_image = generate_segmentation_overlay(
        xray_np, seg_masks, seg_targets,
    )

    composite_image = generate_composite(
        xray_np, gradcam_heatmap, seg_masks, seg_targets,
    )

    inference_time = time.perf_counter() - start

    # ── Step 6 — Build response dict ─────────────────────────────────────────
    return {
        "id":                 str(int(time.time() * 1000)),
        "predicted_class":    predicted_class,
        "confidence":         round(classification["confidence"], 4),
        "probabilities":      classification["probabilities"],
        "inference_time":     round(inference_time, 3),
        "heatmap_image":      heatmap_image,
        "segmentation_image": segmentation_image,
        "composite_image":    composite_image,
        "model_id":           model_id,
        "timestamp":          datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
