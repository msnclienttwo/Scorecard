'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

const toastColors = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastIconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const progressColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number };
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = toastIcons[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative bg-[#0d1320] border border-white/10 border-l-4 ${toastColors[toast.type]} rounded-xl p-4 flex items-center gap-3 min-w-[300px] shadow-xl overflow-hidden`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${toastIconColors[toast.type]}`} />
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/40 hover:text-white transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${progressColors[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export { ToastContainer };
