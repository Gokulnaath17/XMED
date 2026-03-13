import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ZoomIn, ZoomOut, Maximize2, Layers, Sliders, RotateCcw } from 'lucide-react';
import { ViewerLayers, AnalysisResult, ANALYSIS_STEPS } from '../types';
import { AnalysisProgress } from './AnalysisProgress';

interface ImageViewerProps {
  uploadedImage: string | null;
  result: AnalysisResult | null;
  analysisState: string;
  currentStep: number;
  layers: ViewerLayers;
  onLayerToggle: (layer: keyof ViewerLayers) => void;
  heatmapOpacity: number;
  onHeatmapOpacityChange: (val: number) => void;
}

const LAYER_CONFIG = [
  { key: 'original' as const, label: 'Original', color: '#94a3b8' },
  { key: 'gradcam' as const, label: 'Grad-CAM', color: '#f87171' },
  { key: 'segmentation' as const, label: 'Segmentation', color: '#00ffcc' },
];

export function ImageViewer({
  uploadedImage,
  result,
  analysisState,
  currentStep,
  layers,
  onLayerToggle,
  heatmapOpacity,
  onHeatmapOpacityChange,
}: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [heatmapImg, setHeatmapImg] = useState<HTMLImageElement | null>(null);
  const [segImg, setSegImg] = useState<HTMLImageElement | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);

  // Load original image
  useEffect(() => {
    if (!uploadedImage) { setOriginalImg(null); return; }
    const img = new Image();
    img.onload = () => setOriginalImg(img);
    img.src = uploadedImage;
  }, [uploadedImage]);

  // Load result images
  useEffect(() => {
    if (!result) { setHeatmapImg(null); setSegImg(null); return; }
    const h = new Image(); h.onload = () => setHeatmapImg(h); h.src = result.heatmapDataUrl;
    const s = new Image(); s.onload = () => setSegImg(s); s.src = result.segmentationDataUrl;
  }, [result]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!originalImg) return;

    const W = canvas.width;
    const H = canvas.height;

    if (layers.original) {
      ctx.globalAlpha = 1;
      ctx.drawImage(originalImg, 0, 0, W, H);
    } else {
      // Dark base if original hidden
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, W, H);
    }

    if (layers.gradcam && heatmapImg && result) {
      ctx.globalAlpha = heatmapOpacity;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(heatmapImg, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    if (layers.segmentation && segImg && result) {
      ctx.globalAlpha = 1;
      ctx.drawImage(segImg, 0, 0, W, H);
    }

    // Corner scan marks always
    const drawCorner = (x: number, y: number, dx: number, dy: number) => {
      const m = 18;
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + dx * m, y);
      ctx.moveTo(x, y); ctx.lineTo(x, y + dy * m);
      ctx.stroke();
    };
    ctx.shadowBlur = 6; ctx.shadowColor = '#00d4ff';
    drawCorner(10, 10, 1, 1);
    drawCorner(W - 10, 10, -1, 1);
    drawCorner(10, H - 10, 1, -1);
    drawCorner(W - 10, H - 10, -1, -1);
    ctx.shadowBlur = 0;
  }, [originalImg, heatmapImg, segImg, layers, heatmapOpacity, result]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const isEmpty = !uploadedImage;
  const isProcessing = analysisState === 'processing';
  const isDone = analysisState === 'complete';

  return (
    <div className="flex flex-col h-full">
      {/* Viewer toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} style={{ color: '#22d3ee' }} />
          <span className="text-xs tracking-wider uppercase" style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.1em' }}>
            Visualization Workspace
          </span>
          {isDone && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs px-2 py-0.5 rounded-full ml-1"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399',
                fontSize: '9px',
                letterSpacing: '0.05em',
              }}
            >
              ANALYSIS COMPLETE
            </motion.span>
          )}
        </div>

        {/* Layer toggles */}
        <div className="flex items-center gap-1.5">
          {LAYER_CONFIG.map((lc) => {
            const active = layers[lc.key];
            const disabled = !isDone && lc.key !== 'original';
            return (
              <button
                key={lc.key}
                onClick={() => !disabled && onLayerToggle(lc.key)}
                disabled={disabled}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: active && !disabled ? `${lc.color}15` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active && !disabled ? lc.color + '40' : 'rgba(255,255,255,0.04)'}`,
                  color: active && !disabled ? lc.color : '#334155',
                  opacity: disabled ? 0.3 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {active && !disabled ? <Eye size={10} /> : <EyeOff size={10} />}
                {lc.label}
              </button>
            );
          })}

          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Opacity slider toggle */}
          {isDone && (
            <div className="relative">
              <button
                onClick={() => setShowOpacitySlider((p) => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: showOpacitySlider ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${showOpacitySlider ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  color: showOpacitySlider ? '#22d3ee' : '#475569',
                }}
              >
                <Sliders size={10} />
                <span>Opacity</span>
              </button>
              <AnimatePresence>
                {showOpacitySlider && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-8 z-30 p-3 rounded-xl"
                    style={{
                      background: 'rgba(10,15,30,0.96)',
                      border: '1px solid rgba(0,212,255,0.2)',
                      backdropFilter: 'blur(20px)',
                      minWidth: 160,
                    }}
                  >
                    <p className="text-xs mb-2" style={{ color: '#64748b' }}>
                      Heatmap Opacity: <span style={{ color: '#22d3ee' }}>{Math.round(heatmapOpacity * 100)}%</span>
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(heatmapOpacity * 100)}
                      onChange={(e) => onHeatmapOpacityChange(Number(e.target.value) / 100)}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#22d3ee' }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs" style={{ color: '#334155', fontSize: '9px' }}>0%</span>
                      <span className="text-xs" style={{ color: '#334155', fontSize: '9px' }}>100%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(-0.25)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#475569' }}
          >
            <ZoomOut size={11} />
          </button>
          <span className="text-xs w-8 text-center font-mono" style={{ color: '#475569' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#475569' }}
          >
            <ZoomIn size={11} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#475569' }}
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {isEmpty ? (
          <motion.div
            className="flex flex-col items-center gap-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Ghost placeholder */}
            <div
              className="w-48 h-48 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(0,212,255,0.02)',
                border: '1.5px dashed rgba(0,212,255,0.1)',
              }}
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Maximize2 size={32} style={{ color: 'rgba(0,212,255,0.25)', margin: 'auto' }} />
                </motion.div>
                <p className="text-xs" style={{ color: '#1e293b' }}>
                  Image viewer awaiting input
                </p>
              </div>
            </div>
            <p className="text-xs max-w-xs" style={{ color: '#1e293b' }}>
              Upload a medical image to initialize the visualization workspace
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="relative"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.3s ease' }}
          >
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="rounded-xl"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 280px)',
                boxShadow: isDone
                  ? '0 0 40px rgba(0,212,255,0.1), 0 0 0 1px rgba(0,212,255,0.15)'
                  : '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            />

            {/* Processing overlay */}
            <AnalysisProgress
              steps={ANALYSIS_STEPS}
              currentStep={currentStep}
              isVisible={isProcessing}
            />
          </motion.div>
        )}

        {/* Colorbar legend for GradCAM */}
        <AnimatePresence>
          {isDone && layers.gradcam && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-6 bottom-6 rounded-xl p-3"
              style={{
                background: 'rgba(6,8,20,0.88)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.06em' }}>
                ACTIVATION INTENSITY
              </p>
              <div
                className="w-4 h-28 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #ff0a0a, #ff9900, #ffff00, #00cc66, #0070ff)',
                }}
              />
              <div className="flex flex-col justify-between h-28 absolute top-9 left-9">
                {['HIGH', '', 'MED', '', 'LOW'].map((t, i) => (
                  <span key={i} className="text-xs" style={{ color: '#334155', fontSize: '8px' }}>
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Segmentation legend */}
        <AnimatePresence>
          {isDone && layers.segmentation && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-6 bottom-6 rounded-xl p-3 space-y-2"
              style={{
                background: 'rgba(6,8,20,0.88)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-xs" style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.06em' }}>
                SEGMENTATION
              </p>
              {[
                { color: '#00ffcc', label: 'Lung Fields' },
                { color: '#ff7700', label: 'Region of Interest', dashed: true },
              ].map(({ color, label, dashed }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-6 h-0"
                    style={{
                      borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
                      boxShadow: `0 0 6px ${color}80`,
                    }}
                  />
                  <span className="text-xs" style={{ color: '#475569', fontSize: '10px' }}>
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}