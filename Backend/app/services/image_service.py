"""
app/services/image_service.py
==============================
Mock / stub image-generation helpers used by the /analyze endpoint when the
real ML models are not loaded.  These produce plausible-looking overlays so
the API contract is satisfied during development and demos, without requiring
a GPU or heavy ML dependencies.

When the ml/ pipeline is active, the router calls ml.pipeline.run_inference()
instead and none of these functions are invoked.
"""
from __future__ import annotations

import base64
import hashlib
import io
import random
from typing import List, Tuple

from PIL import Image, ImageDraw

from app.models import Probability


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _image_to_base64_png(image: Image.Image) -> str:
    """Encode a PIL image as a base64 PNG string."""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def _build_heatmap_overlay(size: Tuple[int, int]) -> Image.Image:
    """
    Generates a mock Grad-CAM heatmap overlay (radial gradient in jet-like colours).

    Returns an RGBA image the same size as the original so the frontend can
    composite it correctly.
    """
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = size
    cx, cy = width // 2, height // 2
    max_radius = int(min(width, height) * 0.45)

    steps = 6
    for i in range(steps):
        radius = int(max_radius * (1 - (i / steps)))
        alpha = int(180 * (1 - (i / steps)))
        color = (255, 80, 0, alpha)
        bbox = (cx - radius, cy - radius, cx + radius, cy + radius)
        draw.ellipse(bbox, fill=color)

    return overlay


def _build_segmentation_overlay(size: Tuple[int, int]) -> Image.Image:
    """
    Generates a mock anatomical segmentation overlay (simple lung-shaped polygon).

    Returns an RGBA image the same size as the original.
    """
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = size

    polygon = [
        (int(width * 0.2), int(height * 0.6)),
        (int(width * 0.4), int(height * 0.3)),
        (int(width * 0.7), int(height * 0.35)),
        (int(width * 0.8), int(height * 0.7)),
        (int(width * 0.5), int(height * 0.85)),
    ]
    draw.polygon(polygon, fill=(0, 200, 0, 128))

    return overlay


def _build_composite(
    original_rgb: Image.Image,
    heatmap: Image.Image,
    segmentation: Image.Image,
) -> Image.Image:
    """
    Merges the original image with the heatmap and segmentation overlays into
    a single flat RGBA image (the `composite_image` field).
    """
    base = original_rgb.convert("RGBA")
    combined = Image.alpha_composite(base, heatmap)
    combined = Image.alpha_composite(combined, segmentation)
    return combined


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_probabilities(classes: List[str], seed_bytes: bytes) -> List[Probability]:
    """
    Deterministically generates mock class probabilities from the raw image bytes.
    The same image always produces the same result (seeded from its SHA-256 hash).
    Output is sorted descending so the top class is first (matches API contract).
    """
    seed = int.from_bytes(hashlib.sha256(seed_bytes).digest()[:8], "big", signed=False)
    rng = random.Random(seed)
    raw = [rng.random() + 0.01 for _ in classes]
    total = sum(raw)
    normalized = [v / total for v in raw]
    pairs = sorted(zip(classes, normalized), key=lambda x: x[1], reverse=True)
    return [Probability(label=label, probability=prob) for label, prob in pairs]


def generate_mock_images(image: Image.Image) -> Tuple[str, str, str]:
    """
    Produce mock heatmap, segmentation, and composite images from an opened PIL image.

    Returns:
        (heatmap_b64, segmentation_b64, composite_b64) — all base64 PNG strings.
    """
    original = image.convert("RGB")
    heatmap = _build_heatmap_overlay(original.size)
    segmentation = _build_segmentation_overlay(original.size)
    composite = _build_composite(original, heatmap, segmentation)

    return (
        _image_to_base64_png(heatmap),
        _image_to_base64_png(segmentation),
        _image_to_base64_png(composite),
    )
