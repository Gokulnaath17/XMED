"""
ml/preprocessing.py
===================
Converts raw image bytes into a PyTorch tensor ready for DenseNet121 inference.

Pipeline:
    raw bytes → PIL grayscale → XRV normalisation [-1024, 1024] → resize 224×224 → tensor [1,1,224,224]

Notes:
  - Do NOT apply CLAHE, histogram equalisation, or ImageNet (mean/std) normalisation.
  - The tensor is returned on CPU; inference.py moves it to the target device.
"""
from __future__ import annotations

import io

import numpy as np
import torch
import torchxrayvision as xrv
from PIL import Image
from skimage.transform import resize


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Args:
        image_bytes: Raw bytes of the uploaded JPEG or PNG file.

    Returns:
        A float32 CPU tensor of shape ``[1, 1, 224, 224]``.
    """
    # Load as grayscale PIL image
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img_np = np.array(img).astype(np.float32)

    # XRV normalization: maps pixel values [0, 255] → [-1024, 1024]
    img_np = xrv.datasets.normalize(img_np, 255)

    # Resize to classifier input resolution
    img_np = resize(img_np, (224, 224), anti_aliasing=True)

    # Add batch and channel dimensions: [224, 224] → [1, 1, 224, 224]
    tensor = torch.from_numpy(img_np).unsqueeze(0).unsqueeze(0)
    return tensor
