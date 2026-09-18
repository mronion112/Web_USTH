import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SuccessCheckProps {
  size?: number;
  className?: string;
  color?: string;
  delay?: number;
}

export const SuccessCheck: React.FC<SuccessCheckProps> = ({
  size = 56,
  className,
  color = '#1E3B2B',
  delay = 100,
}) => {
  const [state, setState] = useState<'out' | 'in'>('out');

  useEffect(() => {
    const timer = setTimeout(() => {
      setState('in');
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      className={cn('t-success-check', className)}
      data-state={state}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.25"
        />
        <path
          d="M14 24.5L21 31.5L34 17"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
