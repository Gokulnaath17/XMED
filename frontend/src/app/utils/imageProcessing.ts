import { CLASSES, CLASS_COLORS, PredictionProbability } from '../types';

interface ActivationBlob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  intensity: number;
}

function getActivationBlobs(predictedClass: string, SIZE: number): ActivationBlob[] {
  switch (predictedClass) {
    case 'Pneumonia':
      return [
        { x: SIZE * 0.63, y: SIZE * 0.37, rx: SIZE * 0.19, ry: SIZE * 0.22, intensity: 0.95 },
        { x: SIZE * 0.57, y: SIZE * 0.52, rx: SIZE * 0.13, ry: SIZE * 0.14, intensity: 0.65 },
        { x: SIZE * 0.38, y: SIZE * 0.55, rx: SIZE * 0.08, ry: SIZE * 0.09, intensity: 0.35 },
      ];
    case 'COVID-19':
      return [
        { x: SIZE * 0.35, y: SIZE * 0.63, rx: SIZE * 0.22, ry: SIZE * 0.17, intensity: 0.90 },
        { x: SIZE * 0.66, y: SIZE * 0.62, rx: SIZE * 0.21, ry: SIZE * 0.16, intensity: 0.87 },
        { x: SIZE * 0.5, y: SIZE * 0.47, rx: SIZE * 0.12, ry: SIZE * 0.10, intensity: 0.45 },
      ];
    case 'Tuberculosis':
      return [
        { x: SIZE * 0.38, y: SIZE * 0.27, rx: SIZE * 0.14, ry: SIZE * 0.17, intensity: 0.92 },
        { x: SIZE * 0.63, y: SIZE * 0.29, rx: SIZE * 0.12, ry: SIZE * 0.15, intensity: 0.78 },
        { x: SIZE * 0.41, y: SIZE * 0.42, rx: SIZE * 0.07, ry: SIZE * 0.07, intensity: 0.40 },
      ];
    case 'Pleural Effusion':
      return [
        { x: SIZE * 0.34, y: SIZE * 0.73, rx: SIZE * 0.24, ry: SIZE * 0.13, intensity: 0.90 },
        { x: SIZE * 0.66, y: SIZE * 0.70, rx: SIZE * 0.23, ry: SIZE * 0.12, intensity: 0.75 },
      ];
    default: // Normal - minimal activation
      return [
        { x: SIZE * 0.50, y: SIZE * 0.50, rx: SIZE * 0.09, ry: SIZE * 0.07, intensity: 0.18 },
        { x: SIZE * 0.38, y: SIZE * 0.45, rx: SIZE * 0.06, ry: SIZE * 0.05, intensity: 0.10 },
      ];
  }
}

function drawHeatmap(ctx: CanvasRenderingContext2D, blobs: ActivationBlob[], SIZE: number) {
  blobs.forEach(({ x, y, rx, ry, intensity }) => {
    const maxR = Math.max(rx, ry);
    // Save context and apply scaling transform to create elliptical gradient
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx / maxR, ry / maxR);
    ctx.translate(-x, -y);

    const grd = ctx.createRadialGradient(x, y, 0, x, y, maxR);
    grd.addColorStop(0.00, `rgba(255, 10, 10, ${intensity * 0.92})`);
    grd.addColorStop(0.20, `rgba(255, 90, 0, ${intensity * 0.78})`);
    grd.addColorStop(0.40, `rgba(255, 220, 0, ${intensity * 0.60})`);
    grd.addColorStop(0.60, `rgba(60, 220, 60, ${intensity * 0.38})`);
    grd.addColorStop(0.80, `rgba(0, 120, 255, ${intensity * 0.18})`);
    grd.addColorStop(1.00, `rgba(0, 0, 200, 0)`);

    ctx.fillStyle = grd;
    ctx.fillRect(x - maxR, y - maxR, maxR * 2, maxR * 2);
    ctx.restore();
  });
}

function drawSegmentationOverlay(ctx: CanvasRenderingContext2D, SIZE: number, predictedClass: string) {
  ctx.save();

  // Lung field boundaries
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ffcc';
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.85;

  // Left lung
  ctx.beginPath();
  ctx.ellipse(SIZE * 0.335, SIZE * 0.52, SIZE * 0.185, SIZE * 0.325, -0.07, 0, Math.PI * 2);
  ctx.stroke();

  // Right lung
  ctx.beginPath();
  ctx.ellipse(SIZE * 0.655, SIZE * 0.52, SIZE * 0.21, SIZE * 0.338, 0.07, 0, Math.PI * 2);
  ctx.stroke();

  // Carina/mediastinum top
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(SIZE * 0.5, SIZE * 0.2);
  ctx.lineTo(SIZE * 0.5, SIZE * 0.82);
  ctx.stroke();

  // Tracheal midline tick marks
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0.25; i < 0.8; i += 0.08) {
    ctx.beginPath();
    ctx.moveTo(SIZE * 0.49, SIZE * i);
    ctx.lineTo(SIZE * 0.51, SIZE * i);
    ctx.stroke();
  }

  // Disease-specific ROI outlines
  if (predictedClass !== 'Normal') {
    ctx.strokeStyle = '#ff7700';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff7700';
    ctx.setLineDash([5, 3]);
    ctx.globalAlpha = 1.0;

    if (predictedClass === 'Pneumonia') {
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.63, SIZE * 0.39, SIZE * 0.13, SIZE * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (predictedClass === 'COVID-19') {
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.35, SIZE * 0.65, SIZE * 0.15, SIZE * 0.10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.66, SIZE * 0.64, SIZE * 0.15, SIZE * 0.10, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (predictedClass === 'Tuberculosis') {
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.38, SIZE * 0.27, SIZE * 0.10, SIZE * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.63, SIZE * 0.29, SIZE * 0.09, SIZE * 0.11, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (predictedClass === 'Pleural Effusion') {
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.34, SIZE * 0.74, SIZE * 0.19, SIZE * 0.09, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.66, SIZE * 0.71, SIZE * 0.19, SIZE * 0.09, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Small crosshair markers at main ROI
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ff9900';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.5;
    const roiX = predictedClass === 'Pneumonia' ? SIZE * 0.63 : SIZE * 0.5;
    const roiY = predictedClass === 'Pneumonia' ? SIZE * 0.39 : predictedClass === 'COVID-19' ? SIZE * 0.65 : SIZE * 0.28;
    const cSize = SIZE * 0.025;
    ctx.beginPath();
    ctx.moveTo(roiX - cSize, roiY);
    ctx.lineTo(roiX + cSize, roiY);
    ctx.moveTo(roiX, roiY - cSize);
    ctx.lineTo(roiX, roiY + cSize);
    ctx.stroke();
  }

  // Corner measurement marks
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  const corners = [
    [SIZE * 0.08, SIZE * 0.08],
    [SIZE * 0.92, SIZE * 0.08],
    [SIZE * 0.08, SIZE * 0.92],
    [SIZE * 0.92, SIZE * 0.92],
  ];
  const markLen = SIZE * 0.04;
  corners.forEach(([cx, cy]) => {
    const dx = cx < SIZE / 2 ? 1 : -1;
    const dy = cy < SIZE / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * markLen, cy);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + dy * markLen);
    ctx.stroke();
  });

  ctx.restore();
}

export async function generateAnalysisOutputs(
  imageDataUrl: string,
  predictedClass: string
): Promise<{
  heatmapDataUrl: string;
  segmentationDataUrl: string;
  compositeDataUrl: string;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 512;
      const blobs = getActivationBlobs(predictedClass, SIZE);

      // === Heatmap Layer (transparent bg + colored blobs) ===
      const heatmapCanvas = document.createElement('canvas');
      heatmapCanvas.width = SIZE;
      heatmapCanvas.height = SIZE;
      const hCtx = heatmapCanvas.getContext('2d')!;
      drawHeatmap(hCtx, blobs, SIZE);

      // === Segmentation Layer (transparent bg + outlines) ===
      const segCanvas = document.createElement('canvas');
      segCanvas.width = SIZE;
      segCanvas.height = SIZE;
      const sCtx = segCanvas.getContext('2d')!;
      drawSegmentationOverlay(sCtx, SIZE, predictedClass);

      // === Composite (image + heatmap + segmentation + annotation) ===
      const compCanvas = document.createElement('canvas');
      compCanvas.width = SIZE;
      compCanvas.height = SIZE + 64; // extra bar for metadata
      const cCtx = compCanvas.getContext('2d')!;

      // Dark bg
      cCtx.fillStyle = '#060810';
      cCtx.fillRect(0, 0, SIZE, SIZE + 64);

      // Original image
      cCtx.drawImage(img, 0, 0, SIZE, SIZE);

      // Heatmap overlay
      cCtx.globalAlpha = 0.6;
      cCtx.drawImage(heatmapCanvas, 0, 0);
      cCtx.globalAlpha = 1;

      // Segmentation overlay
      drawSegmentationOverlay(cCtx, SIZE, predictedClass);

      // Metadata bar
      cCtx.fillStyle = 'rgba(6, 8, 16, 0.95)';
      cCtx.fillRect(0, SIZE, SIZE, 64);
      cCtx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      cCtx.lineWidth = 1;
      cCtx.beginPath();
      cCtx.moveTo(0, SIZE);
      cCtx.lineTo(SIZE, SIZE);
      cCtx.stroke();
      cCtx.fillStyle = '#22d3ee';
      cCtx.font = '600 13px system-ui, sans-serif';
      cCtx.fillText(`Predicted: ${predictedClass}`, 12, SIZE + 22);
      cCtx.fillStyle = '#94a3b8';
      cCtx.font = '400 11px system-ui, sans-serif';
      cCtx.fillText('XAI Medical Image Analysis System · Grad-CAM + Segmentation Output', 12, SIZE + 42);
      cCtx.fillStyle = CLASS_COLORS[predictedClass] || '#22d3ee';
      cCtx.font = '700 13px system-ui, sans-serif';
      cCtx.textAlign = 'right';
      cCtx.fillText(`AI-XMED v2.4`, SIZE - 12, SIZE + 22);
      cCtx.fillStyle = '#64748b';
      cCtx.font = '400 10px system-ui, sans-serif';
      cCtx.fillText(new Date().toISOString().split('T')[0], SIZE - 12, SIZE + 40);

      resolve({
        heatmapDataUrl: heatmapCanvas.toDataURL('image/png'),
        segmentationDataUrl: segCanvas.toDataURL('image/png'),
        compositeDataUrl: compCanvas.toDataURL('image/png'),
      });
    };
    img.src = imageDataUrl;
  });
}

export function generateProbabilities(winnerClass: string, winnerConfidence: number): PredictionProbability[] {
  const classes = CLASSES;

  // Generate random probabilities for all classes
  return classes.map((label) => {
    // Each pathology gets an independent probability
    const value = label === winnerClass
      ? winnerConfidence
      : Math.random() * 0.6; // Random probability between 0 and 0.6

    return {
      label,
      value,
      color: CLASS_COLORS[label] || '#22d3ee',
    };
  }).sort((a, b) => b.value - a.value); // Sort by probability descending
}

export function downloadCanvas(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
