import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'platform' | 'status' | 'priority' | 'temperature';
  dot?: boolean;
}

export const Badge = ({ className, variant = 'default', dot, children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    platform: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    status: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    priority: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    temperature: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      )}
      {children}
    </div>
  );
};
