import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvailabilitySlotPicker } from './AvailabilitySlotPicker';

const mockGetAvailability = vi.fn();

vi.mock('@/lib/api', () => ({
  bookingsApi: {
    getAvailability: (...args: unknown[]) => mockGetAvailability(...args),
  },
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date('2026-09-24T12:00:00'))}>24</button>
  ),
}));

describe('AvailabilitySlotPicker', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-22T12:00:00'));
    container = document.createElement('div');
    document.body.appendChild(container);
    mockGetAvailability.mockResolvedValue({
      slots: [{ staffAccountId: 7, bookingStart: '2026-09-23T14:00:00', bookingEnd: '2026-09-23T15:00:00' }],
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('excludes the current booking and only enables slots returned by the API', async () => {
    const onChange = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AvailabilitySlotPicker
          items={[{ serviceId: 3, durationMinutes: 60 }]}
          staffAccountId={7}
          excludedBookingId={99}
          value="2026-09-23T10:00:00"
          onChange={onChange}
        />
      );
    });

    expect(mockGetAvailability).toHaveBeenCalledWith(expect.objectContaining({
      staffAccountId: 7,
      excludedBookingId: 99,
      items: [{ serviceId: 3, durationMinutes: 60 }],
      from: '2026-09-23T08:00:00',
      to: '2026-09-23T19:00:00',
    }), expect.any(AbortSignal));

    const slot1400 = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === '14:00');
    const slot1430 = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === '14:30');
    expect(slot1400?.disabled).toBe(false);
    expect(slot1430?.disabled).toBe(true);

    await act(async () => slot1400?.click());
    expect(onChange).toHaveBeenCalledWith('2026-09-23T14:00:00');
  });
});
