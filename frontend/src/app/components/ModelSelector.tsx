import { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Database, Clock, Cpu, Zap, ChevronDown } from 'lucide-react';
import { AIModel } from '../types';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  disabled: boolean;
  theme: 'light' | 'dark';
}

export function ModelSelector({ models, selectedModelId, onSelectModel, disabled, theme }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = models.find((m) => m.id === selectedModelId)!;

  const isDark = theme === 'dark';

  return (
    <div className="space-y-3">
      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `${selectedModel.color}15`,
                border: `1px solid ${selectedModel.color}30`,
              }}
            >
              <Cpu size={13} style={{ color: selectedModel.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {selectedModel.name}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: selectedModel.badge === 'primary' ? 'rgba(0,212,255,0.12)' : 'rgba(167,139,250,0.12)',
                    color: selectedModel.badge === 'primary' ? '#22d3ee' : '#a78bfa',
                    border: `1px solid ${selectedModel.badge === 'primary' ? 'rgba(0,212,255,0.25)' : 'rgba(167,139,250,0.25)'}`,
                    fontSize: '9px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {selectedModel.badge === 'primary' ? 'PRIMARY' : 'EXPERIMENTAL'}
                </span>
              </div>
              <span className="text-xs" style={{ color: isDark ? '#64748b' : '#64748b' }}>
                {selectedModel.params} · ACC {selectedModel.accuracy}%
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} style={{ color: isDark ? '#64748b' : '#64748b' }} />
          </motion.div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{
              background: isDark ? 'rgba(10,15,30,0.98)' : 'rgba(255,255,255,0.98)',
              border: `1px solid ${isDark ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all"
                style={{
                  background: model.id === selectedModelId
                    ? `${model.color}15`
                    : 'transparent',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${model.color}15`,
                    border: `1px solid ${model.color}30`,
                  }}
                >
                  <Cpu size={13} style={{ color: model.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                      {model.name}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: model.badge === 'primary' ? 'rgba(0,212,255,0.12)' : 'rgba(167,139,250,0.12)',
                        color: model.badge === 'primary' ? '#22d3ee' : '#a78bfa',
                        border: `1px solid ${model.badge === 'primary' ? 'rgba(0,212,255,0.25)' : 'rgba(167,139,250,0.25)'}`,
                        fontSize: '9px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {model.badge === 'primary' ? 'PRIMARY' : 'EXPERIMENTAL'}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {model.params} · ACC {model.accuracy}%
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Selected model metadata */}
      <motion.div
        key={selectedModelId}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-3 space-y-2.5"
        style={{
          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Layers size={11} style={{ color: '#22d3ee' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: '#22d3ee', fontSize: '10px', letterSpacing: '0.1em' }}>
            Active Model Config
          </span>
        </div>

        {[
          { icon: <Cpu size={11} />, label: 'Architecture', value: selectedModel.architecture },
          { icon: <Zap size={11} />, label: 'Input Resolution', value: selectedModel.resolution },
          { icon: <Database size={11} />, label: 'Training Dataset', value: selectedModel.dataset },
          { icon: <Clock size={11} />, label: 'Trained At', value: selectedModel.trainedAt },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" style={{ color: isDark ? '#475569' : '#64748b' }}>
              {icon}
              <span className="text-xs">{label}</span>
            </div>
            <span className="text-xs font-mono" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
              {value}
            </span>
          </div>
        ))}

        {/* Metric bar row */}
        <div className="pt-1 grid grid-cols-2 gap-2">
          {[
            { label: 'Accuracy', value: selectedModel.accuracy },
            { label: 'F1 Score', value: selectedModel.f1Score },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: isDark ? '#475569' : '#64748b' }}>{label}</span>
                <span style={{ color: isDark ? '#94a3b8' : '#475569' }}>{value}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${selectedModel.color}80, ${selectedModel.color})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}