"""
ml/visualization.py
===================
Converts raw ML outputs (heatmap arrays and segmentation masks) into
base64-encoded PNG images required by the frontend API contract.

Follows the notebook implementations:
  - Grad-CAM overlay uses ``show_cam_on_image`` from pytorch-grad-cam.
  - Segmentation overlay uses contour-based rendering with ``cv2.findContours``
    + ``cv2.drawContours`` + ``cv2.putText`` for organ labels.
  - Anatomy-constrained CAM multiplies heatmap by relevant organ mask.
"""
from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image
from pytorch_grad_cam.utils.image import show_cam_on_image


# -------------------------------------------------------------------
# Per-organ colors (matching revision notebook)
# -------------------------------------------------------------------
ORGAN_COLORS: dict[str, tuple[int, int, int]] = {
    "Left Lung": (0, 255, 0),
    "Right Lung": (0, 255, 0),
    "Heart": (255, 0, 0),
    "Left Clavicle": (0, 0, 255),
    "Right Clavicle": (0, 0, 255),
}

DEFAULT_COLOR = (255, 255, 0)

# Mapping from pathology → relevant organ for anatomy-constrained CAM
ORGAN_MAP: dict[str, str] = {
    "Cardiomegaly": "Heart",
    "Enlarged Cardiomediastinum": "Heart",
    "Pneumonia": "Left Lung",
    "Atelectasis": "Left Lung",
    "Consolidation": "Left Lung",
    "Lung Opacity": "Left Lung",
    "Lung Lesion": "Left Lung",
    "Pneumothorax": "Left Lung",
    "Edema": "Left Lung",
    "Effusion": "Left Lung",
}


# -------------------------------------------------------------------
# Internal helpers
# -------------------------------------------------------------------

def _tensor_to_vis_image(xray_np: np.ndarray) -> np.ndarray:
    """
    Convert the preprocessed XRV tensor numpy copy to a [0,1] RGB float image
    suitable for ``show_cam_on_image``.

    Input:  xray_np — shape [1, 1, 224, 224] or similar with squeeze-able dims
    Output: np.ndarray float32 shape [224, 224, 3] in [0, 1]
    """
    img = xray_np.squeeze()  # [224, 224]

    # Normalize to [0, 1]
    img_min = img.min()
    img_max = img.max()
    if img_max - img_min > 0:
        img_vis = (img - img_min) / (img_max - img_min)
    else:
        img_vis = np.zeros_like(img)

    # Grayscale → RGB
    img_vis = np.stack([img_vis, img_vis, img_vis], axis=-1).astype(np.float32)
    return img_vis


def _to_base64_png(img_array: np.ndarray) -> str:
    """Encode numpy image (uint8) → base64 PNG string."""
    pil_img = Image.fromarray(img_array)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


# -------------------------------------------------------------------
# Public functions
# -------------------------------------------------------------------

def generate_gradcam_overlay(
    xray_np: np.ndarray,
    heatmap: np.ndarray,
) -> str:
    """
    Create Grad-CAM overlay image using ``show_cam_on_image`` (matching notebooks).

    Args:
        xray_np: Raw tensor numpy copy from preprocessing.
        heatmap: Grad-CAM heatmap [224, 224] float32, values in [0, 1].

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)
    cam_image = show_cam_on_image(img_vis, heatmap, use_rgb=True)
    return _to_base64_png(cam_image)


def generate_segmentation_overlay(
    xray_np: np.ndarray,
    seg_masks: np.ndarray,
    seg_targets: list[str],
) -> str:
    """
    Create anatomical segmentation overlay using contours (matching notebooks).

    Uses ``cv2.findContours`` + ``cv2.drawContours`` + ``cv2.putText`` for
    organ boundary visualization with text labels.

    Args:
        xray_np:     Raw tensor numpy copy from preprocessing.
        seg_masks:   Binary masks [num_classes, 224, 224] uint8.
        seg_targets: Organ/region names list.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)
    # Convert to uint8 for OpenCV drawing
    overlay = (img_vis * 255).astype(np.uint8).copy()

    for i, name in enumerate(seg_targets):
        mask = seg_masks[i]

        if mask.sum() == 0:
            continue

        contours, _ = cv2.findContours(
            mask.astype(np.uint8),
            cv2.RETR_TREE,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        color = ORGAN_COLORS.get(name, DEFAULT_COLOR)

        cv2.drawContours(
            overlay,
            contours,
            -1,
            color,
            2,
        )

        # Add text label at first non-zero pixel
        y, x = np.where(mask)
        if len(x) > 0:
            cv2.putText(
                overlay,
                name,
                (x[0], y[0]),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                1,
            )

    return _to_base64_png(overlay)


def generate_anatomy_cam(
    xray_np: np.ndarray,
    heatmap: np.ndarray,
    seg_masks: np.ndarray,
    seg_targets: list[str],
    target_pathology: str,
) -> str:
    """
    Create anatomy-constrained Grad-CAM image (matching revision notebook).

    Multiplies the heatmap by the relevant organ mask based on the pathology.

    Args:
        xray_np:          Raw tensor numpy copy.
        heatmap:          Grad-CAM heatmap [224, 224] float32.
        seg_masks:        Binary masks [num_classes, 224, 224] uint8.
        seg_targets:      Organ/region names list.
        target_pathology: Name of the predicted pathology.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)
    constrained_cam = heatmap.copy()

    if target_pathology in ORGAN_MAP:
        organ = ORGAN_MAP[target_pathology]
        if organ in seg_targets:
            organ_index = seg_targets.index(organ)
            organ_mask = seg_masks[organ_index].astype(np.float32)
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
    Combine X-ray + Grad-CAM heatmap + segmentation contours.

    Args:
        xray_np:     Raw tensor numpy copy.
        heatmap:     Grad-CAM heatmap [224, 224] float32.
        seg_masks:   Binary masks [num_classes, 224, 224] uint8.
        seg_targets: Organ/region names list.

    Returns:
        Base64-encoded PNG string.
    """
    img_vis = _tensor_to_vis_image(xray_np)

    # Start with Grad-CAM overlay
    cam_image = show_cam_on_image(img_vis, heatmap, use_rgb=True)
    composite = cam_image.copy()

    # Add segmentation contours on top
    for i, name in enumerate(seg_targets):
        mask = seg_masks[i]

        if mask.sum() == 0:
            continue

        contours, _ = cv2.findContours(
            mask.astype(np.uint8),
            cv2.RETR_TREE,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        color = ORGAN_COLORS.get(name, DEFAULT_COLOR)

        cv2.drawContours(
            composite,
            contours,
            -1,
            color,
            2,
        )

        y, x = np.where(mask)
        if len(x) > 0:
            cv2.putText(
                composite,
                name,
                (x[0], y[0]),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                color,
                1,
            )

    return _to_base64_png(composite)