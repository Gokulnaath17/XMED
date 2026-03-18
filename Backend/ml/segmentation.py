"""
ml/segmentation.py
==================
Runs the TorchXRayVision PSPNet model to produce multi-channel binary
anatomical segmentation masks from the preprocessed image tensor.

Follows the revision notebook implementation:
  - Interpolates the 224×224 input tensor to 512×512 for PSPNet.
  - Uses binary threshold (> 0.5) instead of argmax.
  - Resizes each mask back to 224×224 for overlay.
  - Applies morphological cleanup to remove noise and fill small holes.
  - Returns per-organ binary masks and organ names.
"""
from __future__ import annotations

import cv2
import numpy as np
import torch


# Structuring elements reused across masks (built once at import time)
_MORPH_OPEN_KERNEL  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
_MORPH_CLOSE_KERNEL = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))

# Minimum contiguous pixel area to keep (drops isolated specks)
_MIN_COMPONENT_AREA = 64  # pixels²


def _clean_mask(mask: np.ndarray) -> np.ndarray:
    """
    Remove noise and fill small interior holes from a binary uint8 mask.

    Pipeline:
      1. Morphological opening  — erodes then dilates, removes thin filaments.
      2. Morphological closing  — dilates then erodes, seals small gaps/holes.
      3. Connected-component filtering — drops any component < ``_MIN_COMPONENT_AREA``
         pixels, keeping only the largest meaningful regions.

    Args:
        mask: uint8 binary mask of shape ``[H, W]``, values ∈ {0, 1}.

    Returns:
        Cleaned uint8 binary mask of the same shape.
    """
    if mask.sum() == 0:
        return mask

    # --- morphological denoising ---
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  _MORPH_OPEN_KERNEL)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, _MORPH_CLOSE_KERNEL)

    # --- drop tiny connected components ---
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        cleaned, connectivity=8
    )
    out = np.zeros_like(cleaned)
    for lbl in range(1, num_labels):  # 0 is background
        if stats[lbl, cv2.CC_STAT_AREA] >= _MIN_COMPONENT_AREA:
            out[labels == lbl] = 1

    return out


def run_segmentation(
    tensor: torch.Tensor,
    model,
    device: torch.device,
) -> dict:
    """
    Args:
        tensor: Preprocessed input tensor of shape ``[1, 1, 224, 224]`` (CPU).
        model:  TorchXRayVision PSPNet (already on ``device``).
        device: Target torch device.

    Returns:
        dict with keys:
            - ``masks``   : np.ndarray of shape ``[num_classes, 224, 224]`` (uint8 binary)
            - ``targets`` : list of organ/region names from ``model.targets``
    """
    tensor = tensor.to(device)

    # PSPNet requires 512×512 input — interpolate from 224×224
    # (matching revision notebook exactly)
    img_seg = torch.nn.functional.interpolate(
        tensor,
        size=(512, 512),
        mode="bilinear",
        align_corners=False,
    )

    with torch.no_grad():
        seg_output = model(img_seg)  # [1, num_classes, 512, 512]

    seg_output = seg_output.cpu().numpy()[0]  # [num_classes, 512, 512]

    # Binary threshold (NOT argmax — this is the key difference)
    seg_masks = seg_output > 0.5

    # Resize each mask to 224×224, then apply morphological cleanup
    seg_masks_resized = []
    for mask in seg_masks:
        resized = cv2.resize(
            mask.astype(np.uint8),
            (224, 224),
            interpolation=cv2.INTER_NEAREST,
        )
        resized = _clean_mask(resized)
        seg_masks_resized.append(resized)

    seg_masks_resized = np.array(seg_masks_resized)  # [num_classes, 224, 224]

    return {
        "masks": seg_masks_resized,
        "targets": list(model.targets),
    }