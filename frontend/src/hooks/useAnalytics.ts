import { useCallback } from 'react';
import { analytics, EventName, EventProperties } from '../lib/analytics';

export function useAnalytics() {
  const track = useCallback(
    <T extends EventName>(eventName: T, properties: EventProperties<T>) => {
      analytics.track(eventName, properties);
    },
    []
  );

  const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
    analytics.identify(userId, properties);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    analytics.setUserProperties(properties);
  }, []);

  return {
    track,
    identify,
    setUserProperties,
  };
}
