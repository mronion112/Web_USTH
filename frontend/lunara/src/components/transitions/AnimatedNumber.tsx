import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: string | number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, className }) => {
  const [animating, setAnimating] = useState(false);
  const str = String(value);

  useEffect(() => {
    setAnimating(false);
    const frame = requestAnimationFrame(() => {
      setAnimating(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const chars = str.split('');

  return (
    <span className={cn('t-digit-group', animating && 'is-animating', className)}>
      {chars.map((char, index) => {
        let stagger: string | undefined;
        if (index === chars.length - 2) stagger = '1';
        else if (index === chars.length - 1) stagger = '2';

        return (
          <span
            key={`${index}-${char}`}
            className="t-digit"
            data-stagger={stagger}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
};
