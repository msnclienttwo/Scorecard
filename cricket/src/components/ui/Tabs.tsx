'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[data-tab]');
    if (buttons[activeIndex]) {
      const btn = buttons[activeIndex];
      setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [activeTab, tabs]);

  return (
    <div
      ref={containerRef}
      className={cn('relative flex gap-1 bg-white/5 rounded-xl p-1', className)}
    >
      <motion.div
        className="absolute top-1 h-[calc(100%-8px)] bg-white/10 rounded-lg"
        animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            data-tab
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'text-white' : 'text-white/60 hover:text-white'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
