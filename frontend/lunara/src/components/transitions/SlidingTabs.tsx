import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: React.ReactNode;
}

interface SlidingTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  pillClassName?: string;
  tabClassName?: string;
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  className,
  pillClassName,
  tabClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  const updatePill = (animate = true) => {
    if (!containerRef.current || !pillRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-key="${activeKey}"]`
    );
    if (!activeBtn) return;

    if (!animate) {
      pillRef.current.style.transition = 'none';
    } else {
      pillRef.current.style.transition = '';
    }

    const offsetLeft = activeBtn.offsetLeft;
    const offsetWidth = activeBtn.offsetWidth;

    pillRef.current.style.transform = `translateX(${offsetLeft}px)`;
    pillRef.current.style.width = `${offsetWidth}px`;

    if (!animate) {
      void pillRef.current.offsetHeight;
      pillRef.current.style.transition = '';
    }
  };

  useLayoutEffect(() => {
    updatePill(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      updatePill(true);
    }
  }, [activeKey, ready]);

  useEffect(() => {
    const handleResize = () => updatePill(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeKey]);

  return (
    <div
      ref={containerRef}
      className={cn('t-tabs', className)}
      role="tablist"
    >
      <span ref={pillRef} className={cn('t-tabs-pill', pillClassName)} aria-hidden="true" />
      {tabs.map((tab) => {
        const isSelected = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            data-tab-key={tab.key}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange(tab.key)}
            className={cn('t-tab', tabClassName)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
