import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Image as ImageIcon, FolderOpen, Scan } from 'lucide-react';

interface ImageUploaderProps {
  uploadedImage: string | null;
  onImageUpload: (dataUrl: string) => void;
  onImageClear: () => void;
  analysisState: string;
  theme: 'light' | 'dark';
}

export function ImageUploader({
  uploadedImage,
  onImageUpload,
  onImageClear,
  analysisState,
  theme,
}: ImageUploaderProps) {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  if (uploadedImage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(0, 212, 255, 0.04)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 p-3">
          <div
            className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
            style={{ border: '1px solid rgba(0, 212, 255, 0.3)' }}
          >
            <img src={uploadedImage} alt="uploaded" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, transparent 100%)',
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Scan size={11} style={{ color: '#22d3ee' }} />
              <span className="text-xs" style={{ color: '#22d3ee', letterSpacing: '0.05em' }}>
                IMAGE LOADED
              </span>
            </div>
            <p className="text-sm truncate" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Medical image ready for analysis
            </p>
            <p className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>
              Click analyze to begin inference
            </p>
          </div>
          {analysisState === 'idle' && (
            <button
              onClick={onImageClear}
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f87171')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#64748b')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-3 pb-2.5 text-xs text-left transition-colors"
          style={{ color: isDark ? '#475569' : '#64748b' }}
        >
          <FolderOpen size={11} className="inline mr-1" />
          Replace image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div
        className="relative rounded-xl cursor-pointer overflow-hidden"
        style={{
          background: isDragging
            ? 'rgba(0, 212, 255, 0.08)'
            : isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
          border: `1.5px dashed ${isDragging ? 'rgba(0, 212, 255, 0.7)' : isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 150, 255, 0.3)'}`,
          transition: 'all 0.25s ease',
          boxShadow: isDragging ? '0 0 20px rgba(0, 212, 255, 0.12) inset' : 'none',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
          <motion.div
            className="relative"
            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            >
              <Upload size={20} style={{ color: '#22d3ee' }} />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl"
              style={{ border: '1px solid rgba(0,212,255,0.3)' }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <div className="text-center">
            <p className="text-sm mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {isDragging ? 'Release to upload' : 'Drop medical image here'}
            </p>
            <p className="text-xs" style={{ color: isDark ? '#475569' : '#64748b' }}>
              DICOM, PNG, JPG, TIFF — up to 50MB
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#22d3ee',
            }}
          >
            <FolderOpen size={11} />
            Browse Files
          </div>
        </div>

        {/* Animated corner accents */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
          <motion.div
            key={i}
            className={`absolute ${pos} w-4 h-4`}
            style={{
              borderTop: i < 2 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
              borderBottom: i >= 2 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
              borderLeft: i % 2 === 0 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
              borderRight: i % 2 === 1 ? '1.5px solid rgba(0,212,255,0.5)' : 'none',
            }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </motion.div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2 mt-3">
        {['Chest X-Ray', 'CT Scan', 'MRI', 'Pathology', 'Fundus'].map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 rounded-md"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              color: isDark ? '#475569' : '#64748b',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
