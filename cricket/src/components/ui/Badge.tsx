import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-white',
        success: 'bg-green-500/20 text-green-400',
        danger: 'bg-red-500/20 text-red-400',
        warning: 'bg-yellow-500/20 text-yellow-400',
        info: 'bg-blue-500/20 text-blue-400',
        accent: 'bg-cyan-500/20 text-cyan-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
