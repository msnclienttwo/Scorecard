'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  className?: string;
}

const colorGradients = {
  blue: 'from-blue-500 to-blue-400',
  green: 'from-green-500 to-green-400',
  red: 'from-red-500 to-red-400',
  yellow: 'from-yellow-500 to-yellow-400',
};

const colorSolid = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

function ProgressBar({ value, label, showPercentage, color = 'blue', className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-white/70">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className={cn('h-full rounded-full bg-gradient-to-r', colorGradients[color])}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
