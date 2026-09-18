import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn('t-shimmer', className)}
      data-text={children}
      {...props}
    >
      {children}
    </span>
  );
};
