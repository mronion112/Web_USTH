import { getApiOrigin, getStoredToken } from './api';

export type RefreshTopic = 'booking' | 'payment' | 'task' | 'calendar' | 'notification' | 'availability';
export type RefreshCallback = (signal: AbortSignal) => void | Promise<void>;

export interface RefreshSubscription {
  unsubscribe(): void;
  refresh(): void;
}

export interface RefreshTransport {
  subscribe(topic: RefreshTopic, callback: RefreshCallback): RefreshSubscription;
}

const TOPIC_DELAYS: Record<RefreshTopic, number> = {
  payment: 5_000,
  booking: 10_000,
  task: 10_000,
  calendar: 10_000,
  notification: 15_000,
  availability: 30_000,
};

export class PollingRefreshTransport implements RefreshTransport {
  subscribe(topic: RefreshTopic, callback: RefreshCallback): RefreshSubscription {
    let timer: number | undefined;
    let controller: AbortController | undefined;
    let stopped = false;
    let running = false;
    let refreshWhenIdle = false;

    const clear = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      controller?.abort();
      controller = undefined;
    };

    const schedule = () => {
      if (!stopped && document.visibilityState === 'visible') {
        timer = window.setTimeout(run, TOPIC_DELAYS[topic]);
      }
    };

    const run = async () => {
      if (stopped || running || document.visibilityState !== 'visible') return;
      running = true;
      controller = new AbortController();
      try {
        await callback(controller.signal);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          // A failed refresh is retried on the next normal cycle.
        }
      } finally {
        running = false;
        controller = undefined;
        if (refreshWhenIdle && !stopped && document.visibilityState === 'visible') {
          refreshWhenIdle = false;
          void run();
        } else {
          schedule();
        }
      }
    };

    const onVisibilityChange = () => {
      clear();
      if (document.visibilityState === 'visible') {
        refreshWhenIdle = true;
        void run();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    void run();

    return {
      refresh: () => {
        clear();
        refreshWhenIdle = true;
        void run();
      },
      unsubscribe: () => {
        stopped = true;
        clear();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      },
    };
  }
}

type InvalidationCallback = () => void;

const EVENT_INVALIDATIONS: Record<RefreshTopic, RefreshTopic[]> = {
  booking: ['booking', 'task', 'notification'],
  payment: ['payment', 'booking', 'notification'],
  task: ['task'],
  calendar: ['calendar', 'availability', 'booking', 'task'],
  notification: ['notification'],
  availability: ['availability'],
};

class KafkaSseInvalidationClient {
  private listeners = new Map<RefreshTopic, Set<InvalidationCallback>>();
  private controller?: AbortController;
  private reconnectTimer?: number;
  private connecting = false;

  constructor() {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  subscribe(topic: RefreshTopic, callback: InvalidationCallback): () => void {
    const callbacks = this.listeners.get(topic) ?? new Set<InvalidationCallback>();
    callbacks.add(callback);
    this.listeners.set(topic, callbacks);
    this.ensureConnected();
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) this.listeners.delete(topic);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.disconnect(false);
    else this.ensureConnected();
  };

  private ensureConnected = () => {
    if (this.connecting || this.controller || this.listeners.size === 0 || document.visibilityState !== 'visible') return;
    const token = getStoredToken();
    if (!token) {
      this.scheduleReconnect();
      return;
    }
    this.connecting = true;
    this.controller = new AbortController();
    const controller = this.controller;
    void fetch(`${getApiOrigin()}/api/events`, {
      headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) throw new Error(`SSE HTTP ${response.status}`);
        this.connecting = false;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            this.consumeFrame(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (this.controller === controller) this.controller = undefined;
        this.connecting = false;
        this.scheduleReconnect();
      });
  };

  private consumeFrame(frame: string) {
    const eventName = frame.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
    if (eventName !== 'refresh') return;
    const data = frame.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('');
    try {
      const envelope = JSON.parse(data) as { topic?: RefreshTopic };
      if (!envelope.topic) return;
      for (const topic of EVENT_INVALIDATIONS[envelope.topic] ?? []) {
        this.listeners.get(topic)?.forEach((callback) => callback());
      }
    } catch {
      // Ignore malformed frames and keep the live stream connected.
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== undefined || this.listeners.size === 0 || document.visibilityState !== 'visible') return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      this.ensureConnected();
    }, 5_000);
  }

  private disconnect(clearReconnect = true) {
    this.controller?.abort();
    this.controller = undefined;
    this.connecting = false;
    if (clearReconnect && this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }
}

export class RealtimeRefreshTransport implements RefreshTransport {
  private readonly events = new KafkaSseInvalidationClient();

  constructor(private readonly fallback: RefreshTransport = new PollingRefreshTransport()) {}

  subscribe(topic: RefreshTopic, callback: RefreshCallback): RefreshSubscription {
    const polling = this.fallback.subscribe(topic, callback);
    const unsubscribeEvent = this.events.subscribe(topic, () => polling.refresh());
    return {
      refresh: () => polling.refresh(),
      unsubscribe: () => {
        unsubscribeEvent();
        polling.unsubscribe();
      },
    };
  }
}

export const refreshTransport: RefreshTransport = new RealtimeRefreshTransport();
