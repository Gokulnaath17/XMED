"""
ml/segmentation.py
==================
Runs the TorchXRayVision PSPNet model to produce multi-channel binary
anatomical segmentation masks from the preprocessed image tensor.

Follows the revision notebook implementation:
  - Interpolates the 224×224 input tensor to 512×512 for PSPNet.
  - Uses binary threshold (> 0.5) instead of argmax.
  - Resizes each mask back to 224×224 for overlay.
  - Returns per-organ binary masks and organ names.
"""
from __future__ import annotations

import cv2
import numpy as np
import torch


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

    # Resize each mask to 224×224 (matching revision notebook)
    seg_masks_resized = []
    for mask in seg_masks:
        resized = cv2.resize(
            mask.astype(np.uint8),
            (224, 224),
            interpolation=cv2.INTER_NEAREST,
        )
        seg_masks_resized.append(resized)

    seg_masks_resized = np.array(seg_masks_resized)  # [num_classes, 224, 224]

    return {
        "masks": seg_masks_resized,
        "targets": list(model.targets),
    }
