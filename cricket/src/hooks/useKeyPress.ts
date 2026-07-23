'use client';

import { useEffect, useCallback } from 'react';

export function useKeyPress(
  targetKey: string,
  callback: () => void
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    },
    [targetKey, callback]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
