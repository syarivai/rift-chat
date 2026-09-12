import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Wires real connectivity into React Query. With this, queries **pause** while offline
 * instead of firing, failing, and burning their retries — so coming back online resumes
 * rather than recovers.
 *
 * Call once, at the app root.
 */
export function setupOnlineManager(): void {
  onlineManager.setEventListener((setIsOnline) =>
    NetInfo.addEventListener((state) => {
      // `isInternetReachable` is null while unknown; only treat an explicit false as offline,
      // otherwise the app flashes an offline banner on every cold start.
      setIsOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    }),
  );
}

/** Subscribes to the same signal the query client uses, so the UI cannot disagree with it. */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe((value) => setIsOnline(value)), []);

  return isOnline;
}
