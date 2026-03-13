import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Loader2, RotateCcw, ChevronLeft, ChevronRight,
  Zap, Upload, Settings, BarChart2, Cpu
} from 'lucide-react';
import { TopNav } from './components/TopNav';
import { ImageUploader } from './components/ImageUploader';
import { ModelSelector } from './components/ModelSelector';
import { ImageViewer } from './components/ImageViewer';
import { ResultsPanel } from './components/ResultsPanel';
import {
  AnalysisState, AnalysisResult, HistoryEntry, ViewerLayers,
  MODELS, CLASSES, ANALYSIS_STEPS,
} from './types';


const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('densenet121-res224-all');
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [layers, setLayers] = useState<ViewerLayers>({ original: true, gradcam: true, segmentation: true });
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleLayerToggle = useCallback((layer: keyof ViewerLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleImageUpload = useCallback((dataUrl: string) => {
    setUploadedImage(dataUrl);
    setResult(null);
    setAnalysisState('idle');
    setCurrentStep(0);
  }, []);

  const handleImageClear = useCallback(() => {
    setUploadedImage(null);
    setResult(null);
    setAnalysisState('idle');
    setCurrentStep(0);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!uploadedImage || analysisState === 'processing') return;

    setAnalysisState('processing');
    setResult(null);
    setCurrentStep(0);
    setLayers({ original: true, gradcam: false, segmentation: false });

    try {
      // 1. Convert Base64 dataURL to Blob
      const res = await fetch(uploadedImage);
      const blob = await res.blob();

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      formData.append('model_id', selectedModelId);

      // Simulate steps progress while waiting for API
      const progressTimer = setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
      }, 800);

      // 3. Call actual API
      const apiResponse = await fetch('/api/v1/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${apiResponse.statusText}`);
      }

      const backendResult = await apiResponse.json();
      setCurrentStep(ANALYSIS_STEPS.length - 1); 

      const newResult: AnalysisResult = {
        id: backendResult.id,
        predictedClass: backendResult.predicted_class,
        confidence: backendResult.confidence,
        probabilities: backendResult.probabilities.map((p: any) => ({
          label: p.label,
          value: p.probability,
          color: CLASSES.includes(p.label) ? undefined : '#64748b' // Let UI handle color if needed
        })),
        inferenceTime: backendResult.inference_time,
        heatmapDataUrl: `data:image/png;base64,${backendResult.heatmap_image}`,
        segmentationDataUrl: `data:image/png;base64,${backendResult.segmentation_image}`,
        compositeDataUrl: `data:image/png;base64,${backendResult.composite_image}`,
        modelId: backendResult.model_id || selectedModelId,
        timestamp: new Date(backendResult.timestamp),
      };

      setResult(newResult);
      setAnalysisState('complete');

      // Enable all layers with animation
      await delay(300);
      setLayers({ original: true, gradcam: true, segmentation: false });
      await delay(400);
      setLayers({ original: true, gradcam: true, segmentation: true });

      // Add to session history
      const histEntry: HistoryEntry = {
        id: newResult.id,
        thumbnailUrl: uploadedImage,
        modelName: MODELS.find((m) => m.id === newResult.modelId)?.name ?? newResult.modelId,
        predictedClass: newResult.predictedClass,
        confidence: newResult.confidence,
        timestamp: newResult.timestamp,
        result: newResult,
      };
      setHistory((prev) => [histEntry, ...prev.slice(0, 9)]);

    } catch (error: any) {
      console.error('Analysis failed', error);
      setAnalysisState('idle');
      alert(`Analysis failed: ${error.message}`);
    }
  }, [uploadedImage, selectedModelId, analysisState]);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setResult(entry.result);
    setUploadedImage(entry.thumbnailUrl);
    setSelectedModelId(entry.result.modelId);
    setAnalysisState('complete');
    setLayers({ original: true, gradcam: true, segmentation: true });
  }, []);

  const systemStatus =
    analysisState === 'processing' ? 'processing' : uploadedImage ? 'online' : 'online';

  const selectedModel = MODELS.find((m) => m.id === selectedModelId)!;

  const canAnalyze = !!uploadedImage && analysisState !== 'processing';

  const isDark = theme === 'dark';

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(160deg, #06080f 0%, #080c1a 50%, #070a14 100%)'
          : 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
        color: isDark ? '#e2e8f0' : '#1e293b',
      }}
    >
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient glow blobs */}
      <div
        className="fixed top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: isDark ? 'rgba(0,80,200,0.04)' : 'rgba(0,150,255,0.06)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.06)',
          filter: 'blur(80px)',
        }}
      />

      <TopNav systemStatus={systemStatus} theme={theme} onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden pt-14 relative z-10">
        {/* LEFT PANEL */}
        <motion.div
          animate={{ width: leftCollapsed ? 48 : 320 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 flex flex-col h-full overflow-hidden"
          style={{
            background: isDark ? 'rgba(6,8,20,0.7)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(24px)',
            borderRight: `1px solid ${isDark ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setLeftCollapsed((p) => !p)}
            className="absolute top-4 -right-3 z-20 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? 'rgba(0,212,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
              color: '#22d3ee',
            }}
          >
            {leftCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          <AnimatePresence>
            {!leftCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-4 space-y-5"
                style={{ scrollbarWidth: 'none' }}
              >
                {/* Image Input Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Upload size={12} style={{ color: '#22d3ee' }} />
                    <span
                      className="text-xs tracking-wider uppercase"
                      style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.12em' }}
                    >
                      Image Input
                    </span>
                  </div>
                  <ImageUploader
                    uploadedImage={uploadedImage}
                    onImageUpload={handleImageUpload}
                    onImageClear={handleImageClear}
                    analysisState={analysisState}
                    theme={theme}
                  />
                </div>

                {/* Divider */}
                <div
                  className="flex items-center gap-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                />

                {/* Model Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings size={12} style={{ color: '#22d3ee' }} />
                    <span
                      className="text-xs tracking-wider uppercase"
                      style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.12em' }}
                    >
                      Weights Configuration
                    </span>
                  </div>
                  <ModelSelector
                    models={MODELS}
                    selectedModelId={selectedModelId}
                    onSelectModel={setSelectedModelId}
                    disabled={analysisState === 'processing'}
                    theme={theme}
                  />
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

                {/* Analyze button */}
                <div className="space-y-2 pb-4">
                  <motion.button
                    onClick={runAnalysis}
                    disabled={!canAnalyze}
                    className="w-full relative rounded-xl py-3.5 text-sm flex items-center justify-center gap-2.5 overflow-hidden transition-all"
                    style={{
                      background: canAnalyze
                        ? 'linear-gradient(135deg, rgba(0,102,204,0.9) 0%, rgba(0,180,255,0.9) 100%)'
                        : 'rgba(255,255,255,0.04)',
                      border: canAnalyze
                        ? '1px solid rgba(0,212,255,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: canAnalyze ? '#fff' : '#334155',
                      cursor: canAnalyze ? 'pointer' : 'not-allowed',
                      boxShadow: canAnalyze ? '0 0 24px rgba(0,180,255,0.2)' : 'none',
                    }}
                    whileHover={canAnalyze ? { scale: 1.01, boxShadow: '0 0 32px rgba(0,180,255,0.3)' } : {}}
                    whileTap={canAnalyze ? { scale: 0.99 } : {}}
                  >
                    {/* Shimmer on hover */}
                    {canAnalyze && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                      />
                    )}
                    {analysisState === 'processing' ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Loader2 size={16} />
                        </motion.div>
                        <span>Inferencing…</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Run Analysis</span>
                      </>
                    )}
                  </motion.button>

                  {analysisState === 'complete' && (
                    <motion.button
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setAnalysisState('idle');
                        setResult(null);
                        setCurrentStep(0);
                        setLayers({ original: true, gradcam: false, segmentation: false });
                      }}
                      className="w-full rounded-xl py-2 text-xs flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#475569',
                      }}
                    >
                      <RotateCcw size={11} />
                      Reset Analysis
                    </motion.button>
                  )}

                  {!uploadedImage && (
                    <p className="text-center text-xs" style={{ color: isDark ? '#1e293b' : '#64748b' }}>
                      Upload an image to enable analysis
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed icon column */}
          {leftCollapsed && (
            <div className="flex flex-col items-center pt-4 gap-3">
              <Upload size={14} style={{ color: '#334155' }} />
              <Settings size={14} style={{ color: '#334155' }} />
              <Cpu size={14} style={{ color: '#334155' }} />
            </div>
          )}
        </motion.div>

        {/* CENTER PANEL */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          style={{ background: isDark ? 'rgba(6,8,16,0.5)' : 'rgba(240,245,250,0.5)' }}
        >
          {/* Center header bar */}
          <div
            className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
            style={{
              background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
                style={{
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(0,212,255,0.12)',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: selectedModel.color,
                    boxShadow: `0 0 6px ${selectedModel.color}`,
                  }}
                />
                <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {selectedModel.fullName}
                </span>
              </div>
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: isDark ? '#475569' : '#64748b' }}
                >
                  <span>·</span>
                  <span style={{ color: isDark ? '#334155' : '#64748b' }}>Inference Time:</span>
                  <span className="font-mono" style={{ color: '#22d3ee' }}>
                    {result.inferenceTime.toFixed(3)}s
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? '#334155' : '#64748b' }}>
              {uploadedImage && !result && analysisState === 'idle' && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ color: '#22d3ee' }}
                >
                  Ready for analysis
                </motion.span>
              )}
              {analysisState === 'processing' && (
                <span style={{ color: '#fbbf24' }}>Processing…</span>
              )}
              {result && (
                <span style={{ color: '#34d399' }}>
                  Analysis complete
                </span>
              )}
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 overflow-hidden relative">
            <ImageViewer
              uploadedImage={uploadedImage}
              result={result}
              analysisState={analysisState}
              currentStep={currentStep}
              layers={layers}
              onLayerToggle={handleLayerToggle}
              heatmapOpacity={heatmapOpacity}
              onHeatmapOpacityChange={setHeatmapOpacity}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <motion.div
          animate={{ width: rightCollapsed ? 48 : 340 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 flex flex-col h-full overflow-hidden relative"
          style={{
            background: isDark ? 'rgba(6,8,20,0.7)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(24px)',
            borderLeft: `1px solid ${isDark ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setRightCollapsed((p) => !p)}
            className="absolute top-4 -left-3 z-20 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? 'rgba(0,212,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
              color: '#22d3ee',
            }}
          >
            {rightCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>

          <AnimatePresence>
            {!rightCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden flex flex-col"
              >
                {/* Right panel header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
                  style={{
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <BarChart2 size={12} style={{ color: '#22d3ee' }} />
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.12em' }}
                  >
                    Analysis Dashboard
                  </span>
                </div>

                <ResultsPanel
                  result={result}
                  history={history}
                  models={MODELS}
                  onSelectHistory={handleSelectHistory}
                  analysisState={analysisState}
                  theme={theme}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed right panel icons */}
          {rightCollapsed && (
            <div className="flex flex-col items-center pt-4 gap-3">
              <BarChart2 size={14} style={{ color: '#334155' }} />
              {result && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#34d399' }}
                />
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom status bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-1.5"
        style={{
          background: isDark ? 'rgba(6,8,16,0.9)' : 'rgba(255,255,255,0.9)',
          borderTop: `1px solid ${isDark ? 'rgba(0,212,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <div className="flex items-center gap-4 text-xs" style={{ color: isDark ? '#1e293b' : '#64748b' }}>
          <span className="font-mono">AI-XMED v2.4.1</span>
          <span>·</span>
          <span>Grad-CAM + U-Net Segmentation Pipeline</span>
          <span>·</span>
          <span className="font-mono">CUDA 12.3 · RTX 4090</span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: isDark ? '#1e293b' : '#64748b' }}>
          {result && (
            <span className="font-mono" style={{ color: isDark ? '#334155' : '#475569' }}>
              Last: {result.timestamp.toLocaleTimeString()}
            </span>
          )}
          <span>Session: {history.length} image{history.length !== 1 ? 's' : ''} analyzed</span>
        </div>
      </div>
    </div>
  );
}
