import { motion, AnimatePresence } from 'motion/react';
import {
  Download, Clock, Target, BarChart2, ShieldCheck, Share2, ChevronRight,
  Activity, Stethoscope, AlertTriangle, CheckCircle2, TrendingUp
} from 'lucide-react';
import { AnalysisResult, HistoryEntry, AIModel, CLASS_COLORS, MODELS } from '../types';
import { downloadCanvas } from '../utils/imageProcessing';

interface ResultsPanelProps {
  result: AnalysisResult | null;
  history: HistoryEntry[];
  models: AIModel[];
  onSelectHistory: (entry: HistoryEntry) => void;
  analysisState: string;
  theme: 'light' | 'dark';
}

function ProbabilityBar({ label, value, color, index, isTop }: {
  label: string; value: number; color: string; index: number; isTop: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {isTop && <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />}
          <span className="text-xs" style={{ color: isTop ? '#e2e8f0' : '#64748b' }}>
            {label}
          </span>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: isTop ? color : '#475569' }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
          style={{
            background: isTop
              ? `linear-gradient(90deg, ${color}80, ${color})`
              : `${color}50`,
            boxShadow: isTop ? `0 0 8px ${color}60` : 'none',
          }}
        />
      </div>
    </motion.div>
  );
}

function EmptyResults({ analysisState }: { analysisState: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6">
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <BarChart2 size={28} style={{ color: 'rgba(0,212,255,0.2)', margin: 'auto' }} />
      </motion.div>
      <p className="text-xs mt-3" style={{ color: '#1e293b' }}>
        {analysisState === 'initializing'
          ? 'Initializing model and downloading weights...'
          : analysisState === 'processing'
          ? 'Computing inference results…'
          : 'Results will appear here after analysis'}
      </p>
    </div>
  );
}

function MetricCard({ label, value, suffix = '', color = '#22d3ee', icon: Icon }: {
  label: string; value: string | number; suffix?: string; color?: string; icon: any;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={11} style={{ color }} />
        <span className="text-xs" style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <span className="text-sm font-mono" style={{ color: '#e2e8f0' }}>
        {value}
        <span className="text-xs ml-1" style={{ color: '#64748b' }}>{suffix}</span>
      </span>
    </div>
  );
}

export function ResultsPanel({ result, history, models, onSelectHistory, analysisState, theme }: ResultsPanelProps) {
  const topProb = result?.probabilities[0];
  const classColor = result ? (CLASS_COLORS[result.predictedClass] || '#22d3ee') : '#22d3ee';
  const selectedModel = models.find((m) => m.id === result?.modelId);
  const isDark = theme === 'dark';

  const handleDownload = () => {
    if (!result) return;
    downloadCanvas(
      result.compositeDataUrl,
      `xmed_${result.predictedClass.replace(' ', '_')}_${Date.now()}.png`
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="p-4 space-y-4 flex-1">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: '#22d3ee' }} />
          <span className="text-xs tracking-wider uppercase" style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.1em' }}>
            Inference Results
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <EmptyResults key="empty" analysisState={analysisState} />
          ) : (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Top Prediction */}
              <motion.div
                className="rounded-xl p-4 relative overflow-hidden"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${classColor}08 0%, rgba(0,0,0,0.2) 100%)`
                    : `linear-gradient(135deg, ${classColor}10 0%, rgba(255,255,255,0.5) 100%)`,
                  border: `1px solid ${classColor}30`,
                  boxShadow: `0 0 20px ${classColor}08`,
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                  style={{
                    background: classColor,
                    filter: 'blur(30px)',
                    transform: 'translate(30%, -30%)',
                  }}
                />
                <div className="flex items-start gap-3 relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${classColor}18`, border: `1px solid ${classColor}30` }}
                  >
                    <Stethoscope size={16} style={{ color: classColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-0.5" style={{ color: '#64748b' }}>Top Prediction</p>
                    <h2 className="text-base" style={{ color: classColor }}>
                      {result.predictedClass}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)', width: 80 }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(result.confidence * 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ background: `linear-gradient(90deg, ${classColor}60, ${classColor})`, boxShadow: `0 0 8px ${classColor}` }}
                        />
                      </div>
                      <motion.span
                        className="text-sm font-mono"
                        style={{ color: classColor }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        {Math.round(result.confidence * 100)}%
                      </motion.span>
                      <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>probability</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mt-3 pt-3"
                  style={{ borderTop: `1px solid ${classColor}15` }}
                >
                  <AlertTriangle size={11} style={{ color: '#fbbf24' }} />
                  <span className="text-xs" style={{ color: isDark ? '#92400e' : '#b45309' }}>
                    Multi-label prediction — multiple pathologies may be present
                  </span>
                </motion.div>
              </motion.div>

              {/* Probability Distribution - All Pathologies */}
              <div
                className="rounded-xl p-3 space-y-2"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <div className="flex items-center justify-between mb-2 sticky top-0" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={11} style={{ color: '#22d3ee' }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.08em' }}>
                      ALL PATHOLOGIES
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: isDark ? '#334155' : '#94a3b8', fontSize: '9px' }}>
                    {result.probabilities.length} classes
                  </span>
                </div>
                <div className="space-y-2">
                  {result.probabilities.map((p, i) => (
                    <ProbabilityBar
                      key={p.label}
                      label={p.label}
                      value={p.value}
                      color={p.color}
                      index={i}
                      isTop={i < 3}
                    />
                  ))}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={11} style={{ color: '#22d3ee' }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.05em' }}>
                      INFERENCE TIME
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {result.inferenceTime.toFixed(3)}
                    <span className="text-xs ml-1" style={{ color: '#64748b' }}>s</span>
                  </span>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target size={11} style={{ color: classColor }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.05em' }}>
                      TOP PROBABILITY
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {Math.round(result.confidence * 100)}
                    <span className="text-xs ml-1" style={{ color: '#64748b' }}>%</span>
                  </span>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={11} style={{ color: '#34d399' }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.05em' }}>
                      MODEL ACCURACY
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {selectedModel?.accuracy ?? '—'}
                    <span className="text-xs ml-1" style={{ color: '#64748b' }}>%</span>
                  </span>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Activity size={11} style={{ color: '#a78bfa' }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.05em' }}>
                      F1 SCORE
                    </span>
                  </div>
                  <span className="text-sm font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    {selectedModel?.f1Score ?? '—'}
                    <span className="text-xs ml-1" style={{ color: '#64748b' }}>%</span>
                  </span>
                </div>
              </div>

              {/* Model validation metrics */}
              <div
                className="rounded-xl p-3"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <ShieldCheck size={11} style={{ color: '#22d3ee' }} />
                  <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.08em' }}>
                    MODEL VALIDATION METRICS
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Sensitivity', value: selectedModel?.sensitivity, color: '#fb923c' },
                    { label: 'Specificity', value: selectedModel?.specificity, color: '#34d399' },
                    { label: 'F1 Score', value: selectedModel?.f1Score, color: '#a78bfa' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className="relative w-14 h-14 mx-auto mb-1">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'} strokeWidth="2.5" />
                          <motion.circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke={color} strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 15}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - (value ?? 0) / 100) }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-mono" style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '10px' }}>
                            {value}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '9px' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction Summary */}
              <div
                className="rounded-xl p-3 space-y-2"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target size={11} style={{ color: '#22d3ee' }} />
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.08em' }}>
                      PREDICTION SUMMARY
                    </span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: isDark ? '#1e293b' : '#94a3b8', fontSize: '9px' }}>
                    #{result.id.slice(-6)}
                  </span>
                </div>
                {[
                  { label: 'Image ID', value: `IMG-${result.id.slice(-8)}` },
                  { label: 'Model', value: selectedModel?.name ?? result.modelId },
                  { label: 'Predicted Label', value: result.predictedClass },
                  { label: 'Probability', value: `${Math.round(result.confidence * 100)}%` },
                  { label: 'Inference Time', value: `${result.inferenceTime.toFixed(3)}s` },
                  { label: 'Timestamp', value: result.timestamp.toLocaleTimeString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>{label}</span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: label === 'Predicted Label' ? classColor : isDark ? '#64748b' : '#475569' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Download */}
              <motion.button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(139,92,246,0.12) 100%)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: '#22d3ee',
                }}
                whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
                whileTap={{ scale: 0.99 }}
              >
                <Download size={14} />
                Download Composite Output
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2 pt-2">
            <div
              className="flex items-center gap-2 pt-2"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}` }}
            >
              <Clock size={11} style={{ color: isDark ? '#475569' : '#64748b' }} />
              <span className="text-xs" style={{ color: isDark ? '#475569' : '#64748b', fontSize: '10px', letterSpacing: '0.08em' }}>
                SESSION HISTORY ({history.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {history.map((entry, i) => {
                const color = CLASS_COLORS[entry.predictedClass] || '#22d3ee';
                const isActive = result?.id === entry.id;
                return (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onSelectHistory(entry)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isActive
                        ? 'rgba(0,212,255,0.06)'
                        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${isActive ? 'rgba(0,212,255,0.2)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ border: `1px solid ${color}30` }}
                    >
                      <img
                        src={entry.thumbnailUrl}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                        style={{ filter: 'grayscale(30%)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs truncate" style={{ color }}>
                          {entry.predictedClass}
                        </span>
                        <span className="text-xs" style={{ color: isDark ? '#334155' : '#64748b' }}>
                          {Math.round(entry.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: isDark ? '#334155' : '#64748b', fontSize: '10px' }}>
                        {entry.modelName} · {entry.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <ChevronRight size={12} style={{ color: isDark ? '#334155' : '#64748b', flexShrink: 0 }} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
