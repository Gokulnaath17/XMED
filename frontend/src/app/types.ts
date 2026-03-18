export interface AIModel {
  id: string;
  name: string;
  fullName: string;
  architecture: string;
  resolution: string;
  dataset: string;
  trainedAt: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1Score: number;
  params: string;
  badge: 'primary' | 'experimental';
  description: string;
  color: string;
}

export interface PredictionProbability {
  label: string;
  value: number;
  color: string;
}

export interface AnalysisResult {
  id: string;
  predictedClass: string; // Top prediction for backward compatibility
  confidence: number; // Top confidence for backward compatibility
  probabilities: PredictionProbability[]; // All pathologies with their probabilities
  inferenceTime: number;
  heatmapDataUrl: string;
  segmentationDataUrl: string;
  compositeDataUrl: string;
  modelId: string;
  timestamp: Date;
}

export interface HistoryEntry {
  id: string;
  thumbnailUrl: string;
  modelName: string;
  predictedClass: string;
  confidence: number;
  timestamp: Date;
  result: AnalysisResult;
}

export type AnalysisState = 'idle' | 'initializing' | 'processing' | 'complete';

export interface ViewerLayers {
  original: boolean;
  gradcam: boolean;
  segmentation: boolean;
}

export interface ProgressStep {
  id: string;
  label: string;
  description: string;
  durationMs: number;
}

export const MODELS: AIModel[] = [
  {
    id: 'densenet121-res224-all',
    name: 'DenseNet-121 (All)',
    fullName: 'DenseNet-121 (All Datasets)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'Various',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'General purpose 14-class pathology detection.',
    color: '#22d3ee',
  },
  {
    id: 'densenet121-res224-rsna',
    name: 'DenseNet-121 (RSNA)',
    fullName: 'DenseNet-121 (RSNA Pneumonia)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'RSNA Pneumonia Challenge',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Optimized for the RSNA Pneumonia Challenge.',
    color: '#34d399',
  },
  {
    id: 'densenet121-res224-nih',
    name: 'DenseNet-121 (NIH)',
    fullName: 'DenseNet-121 (NIH Chest X-ray8)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'NIH ChestX-ray8',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Trained on NIH ChestX-ray8 dataset.',
    color: '#a78bfa',
  },
  {
    id: 'densenet121-res224-pc',
    name: 'DenseNet-121 (PadChest)',
    fullName: 'DenseNet-121 (PadChest - Univ. Alicante)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'PadChest',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Trained on PadChest from University of Alicante.',
    color: '#f472b6',
  },
  {
    id: 'densenet121-res224-chex',
    name: 'DenseNet-121 (CheXpert)',
    fullName: 'DenseNet-121 (CheXpert - Stanford)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'CheXpert',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Trained on CheXpert from Stanford.',
    color: '#fbbf24',
  },
  {
    id: 'densenet121-res224-mimic_nb',
    name: 'DenseNet-121 (MIMIC-NB)',
    fullName: 'DenseNet-121 (MIMIC-CXR MIT NB)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'MIMIC-CXR',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Trained on MIMIC-CXR (Narrow Band).',
    color: '#f87171',
  },
  {
    id: 'densenet121-res224-mimic_ch',
    name: 'DenseNet-121 (MIMIC-CH)',
    fullName: 'DenseNet-121 (MIMIC-CXR MIT CH)',
    architecture: 'DenseNet-121',
    resolution: '224×224',
    dataset: 'MIMIC-CXR',
    trainedAt: 'N/A',
    accuracy: 94.7,
    sensitivity: 92.3,
    specificity: 96.1,
    f1Score: 93.2,
    params: '7.98M',
    badge: 'primary',
    description: 'Trained on MIMIC-CXR (Channel).',
    color: '#60a5fa',
  },
  {
    id: 'resnet50-res512-all',
    name: 'ResNet-50 (512x512)',
    fullName: 'ResNet-50 (512x512 High Res)',
    architecture: 'ResNet-50',
    resolution: '512×512',
    dataset: 'Various',
    trainedAt: 'N/A',
    accuracy: 92.1,
    sensitivity: 90.5,
    specificity: 93.8,
    f1Score: 91.1,
    params: '25.6M',
    badge: 'experimental',
    description: 'Higher resolution model.',
    color: '#a78bfa',
  },
  {
    id: 'jfhealthcare-densenet',
    name: 'DenseNet (JF)',
    fullName: 'DenseNet (JF CheXpert)',
    architecture: 'DenseNet',
    resolution: 'N/A',
    dataset: 'CheXpert',
    trainedAt: 'N/A',
    accuracy: 95.3,
    sensitivity: 94.1,
    specificity: 96.5,
    f1Score: 94.7,
    params: 'N/A',
    badge: 'experimental',
    description: 'JF Healthcare DenseNet for CheXpert competition.',
    color: '#34d399',
  },
];

export const CLASSES = [
  'Atelectasis', 'Consolidation', 'Infiltration', 'Pneumothorax', 'Edema',
  'Emphysema', 'Fibrosis', 'Effusion', 'Pneumonia', 'Pleural_Thickening',
  'Cardiomegaly', 'Nodule', 'Mass', 'Hernia', 'Lung Lesion',
  'Fracture', 'Lung Opacity', 'Enlarged Cardiomediastinum'
];

export const CLASS_COLORS: Record<string, string> = {
  'Atelectasis': '#fb923c',
  'Consolidation': '#f87171',
  'Infiltration': '#fbbf24',
  'Pneumothorax': '#ef4444',
  'Edema': '#60a5fa',
  'Emphysema': '#34d399',
  'Fibrosis': '#a78bfa',
  'Effusion': '#ec4899',
  'Pneumonia': '#f97316',
  'Pleural_Thickening': '#06b6d4',
  'Cardiomegaly': '#f472b6',
  'Nodule': '#eab308',
  'Mass': '#dc2626',
  'Hernia': '#10b981',
  'Lung Lesion': '#f59e0b',
  'Fracture': '#8b5cf6',
  'Lung Opacity': '#14b8a6',
  'Enlarged Cardiomediastinum': '#6366f1',
};

export const ANALYSIS_STEPS: ProgressStep[] = [
  {
    id: 'preprocess',
    label: 'Preprocessing Image',
    description: 'Decode, resize, normalize, and tensorize input',
    durationMs: 400,
  },
  {
    id: 'classify',
    label: 'Running Classifier Forward Pass',
    description: 'Compute logits and top prediction on the classifier',
    durationMs: 800,
  },
  {
    id: 'gradcam',
    label: 'Generating Grad-CAM Heatmap',
    description: 'Backpropagate gradients to build saliency maps',
    durationMs: 500,
  },
  {
    id: 'segmentation',
    label: 'Running U-Net Segmentation',
    description: 'Segment anatomical regions for overlay',
    durationMs: 600,
  },
  {
    id: 'composite',
    label: 'Compositing Overlays',
    description: 'Blend heatmap and segmentation masks',
    durationMs: 300,
  },
  {
    id: 'finalize',
    label: 'Packaging Results',
    description: 'Encode assets and metrics for response',
    durationMs: 250,
  },
];

export const MODEL_INIT_STEPS: ProgressStep[] = [
  {
    id: 'init-cache',
    label: 'Checking Model Cache',
    description: 'Detecting locally available weights',
    durationMs: 500,
  },
  {
    id: 'init-download',
    label: 'Initializing Model Weights',
    description: 'Downloading or loading weights into memory',
    durationMs: 1600,
  },
  {
    id: 'init-warmup',
    label: 'Warming Up Inference Graph',
    description: 'Preparing the runtime for analysis',
    durationMs: 700,
  },
];
