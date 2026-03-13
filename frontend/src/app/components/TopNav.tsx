import { Activity, Brain, Cpu, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface TopNavProps {
  systemStatus: 'online' | 'offline' | 'processing';
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function TopNav({ systemStatus, theme, onThemeToggle }: TopNavProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 border-b"
      style={{
        background: isDark ? 'rgba(6, 8, 16, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        borderColor: isDark ? 'rgba(0, 212, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(139,92,246,0.2) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            boxShadow: '0 0 12px rgba(0,212,255,0.2)',
          }}
        >
          <Brain size={16} className="text-cyan-400" />
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ border: '1px solid rgba(0,212,255,0.6)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div>
          <span
            className="text-sm tracking-widest uppercase"
            style={{ color: '#22d3ee', fontWeight: 600, letterSpacing: '0.15em' }}
          >
            AI-XMED
          </span>
          <span className="text-xs ml-2" style={{ color: '#475569' }}>
            v2.4.1
          </span>
        </div>
        <div
          className="hidden md:block h-4 w-px mx-2"
          style={{ background: 'rgba(0,212,255,0.2)' }}
        />
        <span className="hidden md:block text-xs" style={{ color: '#475569' }}>
          Explainable AI Medical Image Analysis System
        </span>
      </div>

      {/* Center — scan line decoration */}
      <div className="hidden lg:flex items-center gap-6">
        {['Preprocessing', 'Classification', 'Grad-CAM', 'Segmentation'].map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: systemStatus === 'processing' ? '#22d3ee' : '#1e293b' }}
            />
            <span className="text-xs" style={{ color: '#334155' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Right — status */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
          <Cpu size={12} />
          <span>GPU: RTX 4090</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
          <Activity size={12} />
          <span>CUDA 12.3</span>
        </div>

        {/* Theme toggle */}
        <motion.button
          onClick={onThemeToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isDark ? (
            <Sun size={14} style={{ color: '#fbbf24' }} />
          ) : (
            <Moon size={14} style={{ color: '#6366f1' }} />
          )}
        </motion.button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background:
              systemStatus === 'offline'
                ? 'rgba(239,68,68,0.1)'
                : systemStatus === 'processing'
                ? 'rgba(251,191,36,0.1)'
                : 'rgba(52,211,153,0.1)',
            border:
              systemStatus === 'offline'
                ? '1px solid rgba(239,68,68,0.3)'
                : systemStatus === 'processing'
                ? '1px solid rgba(251,191,36,0.3)'
                : '1px solid rgba(52,211,153,0.3)',
          }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background:
                systemStatus === 'offline'
                  ? '#ef4444'
                  : systemStatus === 'processing'
                  ? '#fbbf24'
                  : '#34d399',
            }}
            animate={{ opacity: systemStatus !== 'offline' ? [1, 0.3, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span
            style={{
              color:
                systemStatus === 'offline'
                  ? '#ef4444'
                  : systemStatus === 'processing'
                  ? '#fbbf24'
                  : '#34d399',
            }}
          >
            {systemStatus === 'offline'
              ? 'Offline'
              : systemStatus === 'processing'
              ? 'Inferencing'
              : 'System Online'}
          </span>
        </div>
      </div>
    </div>
  );
}
