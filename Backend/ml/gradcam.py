"""
ml/gradcam.py
=============
Generates Grad-CAM and Grad-CAM++ heatmaps for the top predicted pathology
class using the ``denseblock4`` feature layer of the DenseNet121 backbone.

Follows the revision notebook implementation:
  - Uses ``aug_smooth=True`` and ``eigen_smooth=True`` for smoother heatmaps.
  - Target layer is ``model.features.denseblock4``.

Output is a normalised float32 numpy array of shape ``[224, 224]``.
"""
from __future__ import annotations

import numpy as np
import torch
from pytorch_grad_cam import GradCAM, GradCAMPlusPlus
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget


def generate_gradcam(
    tensor: torch.Tensor,
    model,
    device: torch.device,
    top_class_index: int,
) -> dict:
    """
    Args:
        tensor:          Preprocessed input tensor ``[1, 1, 224, 224]`` (CPU).
        model:           TorchXRayVision DenseNet (on ``device``).
        device:          Target torch device.
        top_class_index: Index of the top predicted class in ``model.pathologies``.

    Returns:
        dict with keys:
            - ``gradcam``   : np.ndarray float32 [224, 224] normalised heatmap
            - ``gradcampp`` : np.ndarray float32 [224, 224] normalised heatmap
    """
    tensor = tensor.to(device)
    target_layers = [model.features.denseblock4]
    targets = [ClassifierOutputTarget(top_class_index)]

    # GradCAM with smoothing (matching revision notebook)
    cam = GradCAM(model=model, target_layers=target_layers)
    grayscale_cam = cam(
        input_tensor=tensor,
        targets=targets,
        aug_smooth=True,
        eigen_smooth=True,
    )[0]  # [224, 224]

    # GradCAM++ with smoothing
    campp = GradCAMPlusPlus(model=model, target_layers=target_layers)
    grayscale_cam_pp = campp(
        input_tensor=tensor,
        targets=targets,
        aug_smooth=True,
        eigen_smooth=True,
    )[0]  # [224, 224]

    return {
        "gradcam": grayscale_cam.astype(np.float32),
        "gradcampp": grayscale_cam_pp.astype(np.float32),
    }
