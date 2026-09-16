import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  maxTilt?: number;
  glare?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  cardClassName,
  maxTilt = 10,
  glare = true,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTilting, setIsTilting] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!containerRef.current || !cardRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

      setIsHover(true);
      setIsTilting(true);

      const ryDeg = ((px - 0.5) * maxTilt).toFixed(2);
      const rxDeg = ((0.5 - py) * maxTilt).toFixed(2);
      const gxPct = (px * 100).toFixed(1);
      const gyPct = (py * 100).toFixed(1);

      cardRef.current.style.setProperty('--tilt-ry', `${ryDeg}deg`);
      cardRef.current.style.setProperty('--tilt-rx', `${rxDeg}deg`);
      cardRef.current.style.setProperty('--tilt-gx', `${gxPct}%`);
      cardRef.current.style.setProperty('--tilt-gy', `${gyPct}%`);
    },
    [maxTilt]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHover(false);
    setIsTilting(false);
    if (cardRef.current) {
      cardRef.current.style.setProperty('--tilt-rx', '0deg');
      cardRef.current.style.setProperty('--tilt-ry', '0deg');
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('t-tilt', isHover && 'is-hover', className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerMove}
      {...props}
    >
      <div
        ref={cardRef}
        className={cn('t-tilt-card h-full w-full', isTilting && 'is-tilting', cardClassName)}
      >
        {children}
        {glare && <div className="t-tilt-glare" aria-hidden="true" />}
      </div>
    </div>
  );
};
