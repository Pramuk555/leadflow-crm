import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Spinner = ({ className, size = 24 }: { className?: string, size?: number }) => {
  return <Loader2 size={size} className={cn("animate-spin text-blue-500", className)} />;
};

export const Skeleton = ({ className }: { className?: string }) => {
  return <div className={cn("animate-pulse rounded-md bg-slate-700/50", className)} />;
};

export const PageLoader = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-950">
      <Spinner size={32} />
      <p className="text-sm font-medium text-slate-400">Loading...</p>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};
