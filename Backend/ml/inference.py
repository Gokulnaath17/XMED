"""
ml/inference.py
===============
Runs the DenseNet121 classifier and returns a structured prediction dict
that matches the frontend API contract exactly.

Follows the notebook implementation:
  - Raw model outputs are used directly (no sigmoid — torchxrayvision
    models already output calibrated scores).
  - Empty-string pathology slots are filtered out.
"""
from __future__ import annotations

import numpy as np
import torch


def run_classification(
    tensor: torch.Tensor,
    model,
    device: torch.device,
) -> dict:
    """
    Args:
        tensor: Preprocessed input tensor of shape ``[1, 1, 224, 224]`` (CPU).
        model:  TorchXRayVision DenseNet model (already on ``device``).
        device: Target torch device.

    Returns:
        dict with keys:
            - ``predicted_class`` (str)  — top class label
            - ``confidence``      (float) — score of top class
            - ``probabilities``   (list)  — sorted list of
              ``{"label": str, "probability": float}`` dicts
            - ``valid_indices``   (list)  — indices of non-empty pathologies
    """
    tensor = tensor.to(device)

    with torch.no_grad():
        output = model(tensor)

    # Raw output — no sigmoid (matches notebook behaviour)
    preds = output.squeeze().cpu().numpy()
    labels = model.pathologies

    # Filter empty-string pathology slots (notebook revision approach)
    valid_indices = [i for i, p in enumerate(labels) if p != ""]
    valid_labels = [labels[i] for i in valid_indices]
    valid_preds = preds[valid_indices]

    # Build sorted probability list
    prob_pairs = sorted(
        [
            {"label": label, "probability": float(pred)}
            for label, pred in zip(valid_labels, valid_preds)
        ],
        key=lambda x: x["probability"],
        reverse=True,
    )

    top = prob_pairs[0]

    # Find the top class index in the FULL model.pathologies array (for GradCAM)
    top_index = valid_indices[int(np.argmax(valid_preds))]

    return {
        "predicted_class": top["label"],
        "confidence": top["probability"],
        "probabilities": prob_pairs,
        "top_index": top_index,
    }
