'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    circle: 'rounded-full',
    rectangle: 'h-48 w-full',
    card: 'h-64 w-full',
  };

  return (
    <div className="relative bg-white/5 rounded-xl overflow-hidden" style={{ width, height }}>
      <div
        className={cn('absolute inset-0', variantClasses[variant], className)}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export { Skeleton };
