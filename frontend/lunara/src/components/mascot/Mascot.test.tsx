import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Mascot } from './Mascot';
import { MascotCompanion } from './MascotCompanion';

describe('Mascot and Companion components', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders mascot with aria-label and triggers boop', async () => {
    const onBoop = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Mascot
          directions="/mascots/panda-directions.webp"
          reactions="/mascots/panda-reactions.webp"
          label="Bé Trúc"
          onBoop={onBoop}
        />
      );
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBe('Boop Bé Trúc');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onBoop).toHaveBeenCalled();
  });

  it('renders companion with speech bubble and toggles minimize', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MascotCompanion
          directions="/mascots/panda-directions.webp"
          reactions="/mascots/panda-reactions.webp"
          initialMessage="Xin chào!"
        />
      );
    });

    expect(container.textContent).toContain('Xin chào!');
    expect(container.textContent).toContain('Bé Trúc');

    const minimizeBtn = container.querySelector('button[aria-label="Thu nhỏ Mascot"]');
    expect(minimizeBtn).not.toBeNull();

    await act(async () => {
      minimizeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const openBtn = container.querySelector('button[aria-label="Mở Bé Trúc Mascot"]');
    expect(openBtn).not.toBeNull();
  });
});
