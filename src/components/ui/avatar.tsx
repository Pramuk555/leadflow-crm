import React from 'react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar = ({ src, name, size = 'md', className }: AvatarProps) => {
  const sizes = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full items-center justify-center font-medium text-white',
        sizes[size],
        !src && getAvatarColor(name),
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
