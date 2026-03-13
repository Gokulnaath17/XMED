import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ProgressStep } from '../types';

interface AnalysisProgressProps {
  steps: ProgressStep[];
  currentStep: number;
  isVisible: boolean;
}

export function AnalysisProgress({ steps, currentStep, isVisible }: AnalysisProgressProps) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6, 8, 20, 0.92)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Scanning animation */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(0deg, transparent 0%, rgba(0,212,255,0.04) 50%, transparent 100%)',
            }}
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Main content */}
          <div className="relative z-10 w-full max-w-xs px-6">
            {/* Title */}
            <div className="text-center mb-6">
              <motion.div
                className="inline-flex items-center gap-2 mb-3"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }}
                />
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{ color: '#22d3ee', letterSpacing: '0.15em' }}
                >
                  INFERENCE PIPELINE
                </span>
              </motion.div>
              <h3 className="text-base" style={{ color: '#e2e8f0' }}>
                {steps[currentStep]?.label}
              </h3>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                {steps[currentStep]?.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: '#475569' }}>
                <span>Pipeline Progress</span>
                <span style={{ color: '#22d3ee' }}>{progress}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #0066cc, #22d3ee)',
                    boxShadow: '0 0 8px rgba(34,211,238,0.6)',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-2">
              {steps.map((step, i) => {
                const status =
                  i < currentStep ? 'done' : i === currentStep ? 'running' : 'pending';
                return (
                  <motion.div
                    key={step.id}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: status === 'pending' ? 0.35 : 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {status === 'done' ? (
                        <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                      ) : status === 'running' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={14} style={{ color: '#22d3ee' }} />
                        </motion.div>
                      ) : (
                        <div
                          className="w-3.5 h-3.5 rounded-full border"
                          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                        />
                      )}
                    </div>

                    {/* Step label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          style={{
                            color:
                              status === 'done'
                                ? '#34d399'
                                : status === 'running'
                                ? '#e2e8f0'
                                : '#334155',
                          }}
                        >
                          {step.label}
                        </span>
                        {status === 'running' && (
                          <motion.span
                            className="text-xs"
                            style={{ color: '#22d3ee', fontSize: '9px' }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            ACTIVE
                          </motion.span>
                        )}
                        {status === 'done' && (
                          <span className="text-xs" style={{ color: '#334155', fontSize: '9px' }}>
                            DONE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step segment bar */}
                    <div
                      className="w-12 h-0.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      {status === 'done' && (
                        <div className="h-full w-full rounded-full" style={{ background: '#34d399' }} />
                      )}
                      {status === 'running' && (
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: '#22d3ee' }}
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Animated corner marks */}
            {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
              <motion.div
                key={i}
                className={`absolute ${pos} w-5 h-5`}
                style={{
                  borderTop: i < 2 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
                  borderBottom: i >= 2 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
                  borderLeft: i % 2 === 0 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
                  borderRight: i % 2 === 1 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
