// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PollingRefreshTransport, type RefreshTopic } from './refresh-transport';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('PollingRefreshTransport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['payment', 5_000],
    ['booking', 10_000],
    ['task', 10_000],
    ['calendar', 10_000],
    ['notification', 15_000],
    ['availability', 30_000],
  ] as [RefreshTopic, number][])('uses the %s polling cadence', async (topic, delay) => {
    const callback = vi.fn(async () => undefined);
    const subscription = new PollingRefreshTransport().subscribe(topic, callback);
    await flushPromises();
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(delay - 1);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(callback).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
  });

  it('never overlaps requests and cleans up on unsubscribe', async () => {
    let finish!: () => void;
    let concurrent = 0;
    let maximumConcurrent = 0;
    const callback = vi.fn(() => new Promise<void>((resolve) => {
      finish = () => {
        concurrent -= 1;
        resolve();
      };
      concurrent += 1;
      maximumConcurrent = Math.max(maximumConcurrent, concurrent);
    }));
    const subscription = new PollingRefreshTransport().subscribe('payment', callback);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(30_000);
    subscription.refresh();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(maximumConcurrent).toBe(1);
    finish();
    await flushPromises();
    expect(callback).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('aborts while hidden and refreshes immediately when visible again', async () => {
    const signals: AbortSignal[] = [];
    const callback = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      if (signals.length === 1) return Promise.resolve();
      return new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }));
    });
    const subscription = new PollingRefreshTransport().subscribe('payment', callback);
    await flushPromises();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(callback).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(signals[1].aborted).toBe(true);

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();
    expect(callback).toHaveBeenCalledTimes(3);

    subscription.unsubscribe();
  });
});
