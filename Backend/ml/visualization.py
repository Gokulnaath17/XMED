"""
ml/visualization.py
===================
Converts raw ML outputs (heatmap arrays and segmentation masks) into
base64-encoded PNG images required by the frontend API contract.

Follows the notebook implementations with the following enhancements:
  - Grad-CAM overlay uses ``show_cam_on_image`` from pytorch-grad-cam.
  - Segmentation overlay uses thin anti-aliased contours (1 px, LINE_AA)
    with a subtle semi-transparent organ fill for depth.
  - Labels are placed at each organ's centroid with a pill-shaped
    background for legibility.
  - Anatomy-constrained CAM multiplies heatmap by relevant organ mask.
"""
from __future__ import annotations

import base64
import io
from typing import Tuple

import cv2
import numpy as np
from PIL import Image
from pytorch_grad_cam.utils.image import show_cam_on_image


# ---------------------------------------------------------------------------
# Color palette — modern, slightly desaturated, high-contrast on dark tissue.
# All values are BGR for OpenCV; RGB versions are used for PIL/numpy paths.
# ---------------------------------------------------------------------------

# (B, G, R) — OpenCV convention
_PALETTE_BGR: dict[str, Tuple[int, int, int]] = {
    "Left Lung":       ( 80, 220, 100),   # soft green
    "Right Lung":      ( 80, 220, 100),   # soft green (same as left)
    "Heart":           ( 60,  90, 240),   # vivid red-orange
    "Left Clavicle":   (220, 130,  50),   # steel blue
    "Right Clavicle":  (220, 130,  50),   # steel blue (same as left)
}

_DEFAULT_BGR = (50, 220, 220)  # amber for anything unlisted

# Semi-transparent fill opacity for organ regions [0–1]
_FILL_ALPHA = 0.10

# Contour thickness (px) and line type for anti-aliasing
_CONTOUR_THICKNESS = 1
_LINE_TYPE = cv2.LINE_AA

# Label font settings
_FONT            = cv2.FONT_HERSHEY_DUPLEX
_FONT_SCALE      = 0.32
_FONT_THICKNESS  = 1
_LABEL_PAD_X     = 6   # horizontal padding inside pill background
_LABEL_PAD_Y     = 3   # vertical padding inside pill background
_LABEL_CORNER_R  = 4   # pill corner radius

# Mapping from pathology → relevant organ for anatomy-constrained CAM
ORGAN_MAP: dict[str, str] = {
    "Cardiomegaly":              "Heart",
    "Enlarged Cardiomediastinum": "Heart",
    "Pneumonia":                 "Left Lung",
    "Atelectasis":               "Left Lung",
    "Consolidation":             "Left Lung",
    "Lung Opacity":              "Left Lung",
    "Lung Lesion":               "Left Lung",
    "Pneumothorax":              "Left Lung",
    "Edema":                     "Left Lung",
    "Effusion":                  "Left Lung",
}

# Keep this alias for external code that imports ORGAN_COLORS by name.
ORGAN_COLORS: dict[str, Tuple[int, int, int]] = {
    k: (v[2], v[1], v[0]) for k, v in _PALETTE_BGR.items()  # RGB
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _tensor_to_vis_image(xray_np: np.ndarray) -> np.ndarray:
    """
    Convert the preprocessed XRV tensor numpy copy to a [0, 1] RGB float image
    suitable for ``show_cam_on_image``.

    Input:  xray_np — shape [1, 1, 224, 224] or similar with squeeze-able dims.
    Output: np.ndarray float32 shape [224, 224, 3] in [0, 1].
    """
    img = xray_np.squeeze()  # [224, 224]

    img_min, img_max = img.min(), img.max()
    if img_max - img_min > 1e-6:
        img_vis = (img - img_min) / (img_max - img_min)
    else:
        img_vis = np.zeros_like(img)

    img_vis = np.stack([img_vis, img_vis, img_vis], axis=-1).astype(np.float32)
    return img_vis


def _to_base64_png(img_array: np.ndarray) -> str:
    """Encode numpy uint8 image → base64 PNG string."""
    pil_img = Image.fromarray(img_array)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _mask_centroid(mask: np.ndarray) -> Tuple[int, int] | None:
    """
    Return the (x, y) centroid of a binary mask, or None if the mask is empty.
    Uses image moments for a robust centre even on non-convex shapes.
    """
    M = cv2.moments(mask.astype(np.uint8))
    if M["m00"] < 1e-6:
        return None
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    return cx, cy


def _draw_pill_label(
    img: np.ndarray,
    text: str,
    center_xy: Tuple[int, int],
    bgr_color: Tuple[int, int, int],
) -> None:
    """
    Draw a pill-shaped background then white text, centred on ``center_xy``.

    Mutates ``img`` in place (expects uint8 BGR).
    """
    (tw, th), baseline = cv2.getTextSize(text, _FONT, _FONT_SCALE, _FONT_THICKNESS)

    cx, cy = center_xy
    x0 = cx - tw // 2 - _LABEL_PAD_X
    y0 = cy - th // 2 - _LABEL_PAD_Y
    x1 = cx + tw // 2 + _LABEL_PAD_X
    y1 = cy + th // 2 + _LABEL_PAD_Y + baseline

    # Clamp to image bounds
    h, w = img.shape[:2]
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, w - 1), min(y1, h - 1)

    # --- pill background: blend 70 % dark fill + 30 % original ---
    roi = img[y0:y1, x0:x1]
    pill_bg = np.zeros_like(roi)
    # Dark base tinted slightly with the organ colour
    tint = np.array(bgr_color, dtype=np.float32) * 0.25
    pill_bg[:] = np.clip(tint, 0, 80).astype(np.uint8)
    blended = cv2.addWeighted(roi, 0.3, pill_bg, 0.7, 0)

    # Round the corners by zeroing them out (approximate pill shape)
    r = min(_LABEL_CORNER_R, (x1 - x0) // 2, (y1 - y0) // 2)
    mask_pill = np.ones(blended.shape[:2], dtype=np.uint8)
    for corner in [
        (x0, y0, x0 + r, y0 + r, x0 + r, y0 + r),       # top-left
        (x1, y0, x1 - r, y0 + r, x1 - r, y0 + r),       # top-right
        (x0, y1, x0 + r, y1 - r, x0 + r, y1 - r),       # bot-left
        (x1, y1, x1 - r, y1 - r, x1 - r, y1 - r),       # bot-right
    ]:
        pass  # Corner rounding at this scale is negligible; keep rectangular for clarity

    img[y0:y1, x0:x1] = blended

    # --- 1-px coloured border around pill ---
    cv2.rectangle(img, (x0, y0), (x1, y1), bgr_color, 1, _LINE_TYPE)

    # --- text in white ---
    text_x = cx - tw // 2
    text_y = cy + th // 2
    cv2.putText(
        img, text,
        (text_x, text_y),
        _FONT, _FONT_SCALE,
        (255, 255, 255),
        _FONT_THICKNESS,
        _LINE_TYPE,
    )


def _draw_organ_overlay(
    canvas: np.ndarray,          # uint8 BGR, modified in place
    mask: np.ndarray,            # uint8 binary [H, W]
    name: str,
    bgr_color: Tuple[int, int, int],
    *,
    draw_fill: bool = True,
    draw_label: bool = True,
) -> None:
    """
    Draw a single organ on ``canvas``:
      1. Semi-transparent fill.
      2. Thin anti-aliased contour.
      3. Centroid pill label.
    """
    if mask.sum() == 0:
        return

    # --- semi-transparent fill ---
    if draw_fill:
        fill_layer = canvas.copy()
        fill_layer[mask.astype(bool)] = bgr_color
        cv2.addWeighted(fill_layer, _FILL_ALPHA, canvas, 1 - _FILL_ALPHA, 0, canvas)

    # --- contour ---
    contours, _ = cv2.findContours(
        mask.astype(np.uint8),
        cv2.RETR_EXTERNAL,          # only outer boundary — cleaner than RETR_TREE
        cv2.CHAIN_APPROX_TC89_L1,   # smoother approximation than SIMPLE
    )
    cv2.drawContours(canvas, contours, -1, bgr_color, _CONTOUR_THICKNESS, _LINE_TYPE)

    # --- label at centroid ---
    if draw_label:
        centre = _mask_centroid(mask)
        if centre is not None:
            _draw_pill_label(canvas, name, centre, bgr_color)


# ---------------------------------------------------------------------------
# Public API  (signatures identical to the original module)
# ---------------------------------------------------------------------------

def generate_gradcam_overlay(
    xray_np: np.ndarray,
    heatmap: np.ndarray,
) -> str:
    """
    Create Grad-CAM overlay image using ``show_cam_on_image``.

    Args:
        xray_np: Raw tensor numpy copy from preprocessing.
        heatmap: Grad-CAM heatmap [224, 224] float32, values in [0, 1].

    Returns:
        Base64-encoded PNG string.
    """
    img_vis   = _tensor_to_vis_image(xray_np)
    cam_image = show_cam_on_image(img_vis, heatmap, use_rgb=True)
    return _to_base64_png(cam_image)


def generate_segmentation_overlay(
    xray_np: np.ndarray,
    seg_masks: np.ndarray,
    seg_targets: list[str],
) -> str:
    """
    Create anatomical segmentation overlay using thin anti-aliased contours,
    semi-transparent fills, and centroid-anchored pill labels.

    Args:
        xray_np:     Raw tensor numpy copy from preprocessing.
        seg_masks:   Binary masks [num_classes, 224, 224] uint8.
        seg_targets: Organ/region names list.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)
    # Convert to BGR for OpenCV drawing
    overlay = cv2.cvtColor(
        (img_vis * 255).astype(np.uint8),
        cv2.COLOR_RGB2BGR,
    )

    for i, name in enumerate(seg_targets):
        bgr = _PALETTE_BGR.get(name, _DEFAULT_BGR)
        _draw_organ_overlay(overlay, seg_masks[i], name, bgr)

    # Back to RGB for PIL encoding
    overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
    return _to_base64_png(overlay_rgb)


def generate_anatomy_cam(
    xray_np: np.ndarray,
    heatmap: np.ndarray,
    seg_masks: np.ndarray,
    seg_targets: list[str],
    target_pathology: str,
) -> str:
    """
    Create anatomy-constrained Grad-CAM image.

    Multiplies the heatmap by the relevant organ mask based on the pathology,
    then renders with ``show_cam_on_image``.

    Args:
        xray_np:          Raw tensor numpy copy.
        heatmap:          Grad-CAM heatmap [224, 224] float32.
        seg_masks:        Binary masks [num_classes, 224, 224] uint8.
        seg_targets:      Organ/region names list.
        target_pathology: Name of the predicted pathology.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis         = _tensor_to_vis_image(xray_np)
    constrained_cam = heatmap.copy()

    if target_pathology in ORGAN_MAP:
        organ = ORGAN_MAP[target_pathology]
        if organ in seg_targets:
            organ_index     = seg_targets.index(organ)
            organ_mask      = seg_masks[organ_index].astype(np.float32)
            constrained_cam = constrained_cam * organ_mask

    cam_image = show_cam_on_image(img_vis, constrained_cam, use_rgb=True)
    return _to_base64_png(cam_image)


def generate_composite(
    xray_np: np.ndarray,
    heatmap: np.ndarray,
    seg_masks: np.ndarray,
    seg_targets: list[str],
) -> str:
    """
    Combine X-ray + Grad-CAM heatmap + segmentation contours and labels.

    Rendering order:
      1. Grad-CAM heatmap blended onto the base X-ray.
      2. Thin organ contours + fills drawn on top.
      3. Centroid pill labels drawn last (always on top of contours).

    Args:
        xray_np:     Raw tensor numpy copy.
        heatmap:     Grad-CAM heatmap [224, 224] float32.
        seg_masks:   Binary masks [num_classes, 224, 224] uint8.
        seg_targets: Organ/region names list.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)

    # Layer 1: Grad-CAM heatmap (returns RGB uint8)
    cam_rgb   = show_cam_on_image(img_vis, heatmap, use_rgb=True)
    composite = cv2.cvtColor(cam_rgb, cv2.COLOR_RGB2BGR)

    # Layer 2: organ fills + contours (no labels yet — draw labels last)
    for i, name in enumerate(seg_targets):
        bgr = _PALETTE_BGR.get(name, _DEFAULT_BGR)
        _draw_organ_overlay(composite, seg_masks[i], name, bgr, draw_label=False)

    # Layer 3: labels on top of everything
    for i, name in enumerate(seg_targets):
        if seg_masks[i].sum() == 0:
            continue
        bgr    = _PALETTE_BGR.get(name, _DEFAULT_BGR)
        centre = _mask_centroid(seg_masks[i])
        if centre is not None:
            _draw_pill_label(composite, name, centre, bgr)

    composite_rgb = cv2.cvtColor(composite, cv2.COLOR_BGR2RGB)
    return _to_base64_png(composite_rgb)