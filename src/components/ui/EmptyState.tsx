'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-16 px-4', className)}>
      {Icon && <Icon className="w-16 h-16 text-white/20" />}
      <h3 className="text-xl font-semibold text-white mt-4">{title}</h3>
      {description && (
        <p className="text-white/50 mt-2 text-center max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="default" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
