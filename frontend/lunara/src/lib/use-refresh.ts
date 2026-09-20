import { useEffect, useRef } from 'react';
import { refreshTransport, RefreshCallback, RefreshTopic } from './refresh-transport';

export function useRefresh(topic: RefreshTopic, callback: RefreshCallback, enabled = true): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const subscription = refreshTransport.subscribe(topic, (signal) => callbackRef.current(signal));
    return () => subscription.unsubscribe();
  }, [topic, enabled]);
}
