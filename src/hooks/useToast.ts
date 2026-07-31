'use client';

import { useCallback } from 'react';
import { useUIStore } from '@/store/useUIStore';

interface ToastOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  const toast = useCallback(
    ({ message, type = 'info', duration }: ToastOptions) => {
      addToast({ message, type, duration });
    },
    [addToast]
  );

  return { toast };
}
