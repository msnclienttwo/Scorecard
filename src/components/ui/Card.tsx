'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'bg-white/5 border border-white/10 rounded-2xl p-6 transition-all',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-lg shadow-black/20',
        interactive: 'cursor-pointer hover:shadow-lg hover:shadow-black/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardProps
  extends VariantProps<typeof cardVariants> {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  as?: React.ElementType;
}

function Card({ className, variant, children, onClick, as: Component = 'div' }: CardProps) {
  if (variant === 'interactive') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(cardVariants({ variant, className }))}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component
      className={cn(cardVariants({ variant, className }))}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

export { Card, cardVariants };
