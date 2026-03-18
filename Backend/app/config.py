"""
app/config.py
=============
Central configuration: constants, class labels, model registry, and pipeline steps.
All other modules import from here — nothing is duplicated.
"""
from __future__ import annotations

from app.models import ModelInfo, StepInfo

# ---------------------------------------------------------------------------
# Server / API constants
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"
MAX_IMAGE_BYTES = 10 * 1024 * 1024          # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}

# ---------------------------------------------------------------------------
# Disease / pathology class labels (matches /classes endpoint and ML model)
# ---------------------------------------------------------------------------
CLASS_LABELS: list[str] = [
    "Normal",
    "Pneumonia",
    "Pleural Effusion",
    "Cardiomegaly",
    "Atelectasis",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
]

# ---------------------------------------------------------------------------
# Model registry — drives the GET /models response and validation in /analyze
# ---------------------------------------------------------------------------
MODEL_REGISTRY: list[ModelInfo] = [
    ModelInfo(
        id="densenet121-res224-all",
        name="DenseNet-121 (All)",
        full_name="DenseNet-121 (All Datasets)",
        description="General purpose 14-class pathology detection.",
        parameters="7.98M",
        accuracy=0.947,
        color="#22d3ee",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-rsna",
        name="DenseNet-121 (RSNA)",
        full_name="DenseNet-121 (RSNA Pneumonia)",
        description="Optimized for the RSNA Pneumonia Challenge.",
        parameters="7.98M",
        accuracy=0.947,
        color="#34d399",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-nih",
        name="DenseNet-121 (NIH)",
        full_name="DenseNet-121 (NIH Chest X-ray8)",
        description="Trained on NIH ChestX-ray8 dataset.",
        parameters="7.98M",
        accuracy=0.947,
        color="#a78bfa",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-pc",
        name="DenseNet-121 (PadChest)",
        full_name="DenseNet-121 (PadChest - Univ. Alicante)",
        description="Trained on PadChest from University of Alicante.",
        parameters="7.98M",
        accuracy=0.947,
        color="#f472b6",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-chex",
        name="DenseNet-121 (CheXpert)",
        full_name="DenseNet-121 (CheXpert - Stanford)",
        description="Trained on CheXpert from Stanford.",
        parameters="7.98M",
        accuracy=0.947,
        color="#fbbf24",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-mimic_nb",
        name="DenseNet-121 (MIMIC-NB)",
        full_name="DenseNet-121 (MIMIC-CXR MIT NB)",
        description="Trained on MIMIC-CXR (Narrow Band).",
        parameters="7.98M",
        accuracy=0.947,
        color="#f87171",
        available=True,
    ),
    ModelInfo(
        id="densenet121-res224-mimic_ch",
        name="DenseNet-121 (MIMIC-CH)",
        full_name="DenseNet-121 (MIMIC-CXR MIT CH)",
        description="Trained on MIMIC-CXR (Channel).",
        parameters="7.98M",
        accuracy=0.947,
        color="#60a5fa",
        available=True,
    ),
    ModelInfo(
        id="resnet50-res512-all",
        name="ResNet-50 (512x512)",
        full_name="ResNet-50 (512x512 High Res)",
        description="Higher resolution model.",
        parameters="25.6M",
        accuracy=0.921,
        color="#a78bfa",
        available=True,
    ),
    ModelInfo(
        id="jfhealthcare-densenet",
        name="DenseNet (JF)",
        full_name="DenseNet (JF CheXpert)",
        description="JF Healthcare model for CheXpert competition.",
        parameters="N/A",
        accuracy=0.953,
        color="#34d399",
        available=True,
    ),
]

# ---------------------------------------------------------------------------
# Pipeline steps shown in the animated progress UI during inference
# ---------------------------------------------------------------------------
ANALYSIS_STEPS: list[StepInfo] = [
    StepInfo(
        id="preprocess",
        label="Preprocessing Image",
        description="Decode, resize, normalize, and tensorize input",
        duration_ms=400,
    ),
    StepInfo(
        id="classify",
        label="Running Classifier Forward Pass",
        description="Compute logits and top prediction on the classifier",
        duration_ms=800,
    ),
    StepInfo(
        id="gradcam",
        label="Generating Grad-CAM Heatmap",
        description="Backpropagate gradients to build saliency maps",
        duration_ms=500,
    ),
    StepInfo(
        id="segmentation",
        label="Running U-Net Segmentation",
        description="Segment anatomical regions for overlay",
        duration_ms=600,
    ),
    StepInfo(
        id="composite",
        label="Compositing Overlays",
        description="Blend heatmap and segmentation masks",
        duration_ms=300,
    ),
    StepInfo(
        id="finalize",
        label="Packaging Results",
        description="Encode assets and metrics for response",
        duration_ms=250,
    ),
]
