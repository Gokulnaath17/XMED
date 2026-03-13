"""
ml/model_loader.py
==================
Loads the DenseNet121 classifier and the PSPNet anatomical segmentation model
from TorchXRayVision at application startup.

Call load_models() once and store the result in app state (or a module-level
singleton in pipeline.py).  All request handlers share the same loaded models.
"""
from __future__ import annotations

import torch


def load_model(model_id: str) -> dict:
    """
    Load and return the classifier and segmentation models.

    Returns a dict with keys:
        - ``classifier``  : torchxrayvision model (eval mode, on device)
        - ``segmentation``: torchxrayvision PSPNet model   (eval mode, on device)
        - ``device``      : torch.device used ("cuda" or "cpu")
    """
    import torchxrayvision as xrv  # noqa: PLC0415

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # ── Classifier ───────────────────────────────────────────────────────────
    if model_id.startswith("resnet"):
        classifier = xrv.models.ResNet(weights=model_id)
    elif model_id == "jfhealthcare-densenet":
        classifier = xrv.baseline_models.jfhealthcare.DenseNet()
    else:
        classifier = xrv.models.DenseNet(weights=model_id)
        
    classifier.eval()
    classifier.to(device)

    # ── Segmentation — PSPNet for anatomical regions ─────────────────────────
    segmentation = xrv.baseline_models.chestx_det.PSPNet()
    segmentation.eval()
    segmentation.to(device)

    return {
        "classifier": classifier,
        "segmentation": segmentation,
        "device": device,
    }
