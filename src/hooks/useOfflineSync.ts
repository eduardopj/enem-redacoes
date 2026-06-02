import { useAppStore } from '@/store/app-store';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

/**
 * Monitors network connectivity.
 * When the device comes back online, automatically flushes the correction retry queue.
 *
 * Returns { isOnline } so components can show/hide the offline banner.
 */
export function useOfflineSync() {
  const processRetryQueue = useAppStore((state) => state.processRetryQueue);
  const retryQueue = useAppStore((state) => state.retryQueue);
  const [isOnline, setIsOnline] = useState(true);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (!online) {
        wasOffline.current = true;
      } else if (wasOffline.current) {
        wasOffline.current = false;
        // Back online — flush any queued corrections
        if (retryQueue.length > 0) {
          processRetryQueue();
        }
      }
    });

    return unsubscribe;
  }, [processRetryQueue, retryQueue]);

  return { isOnline };
}
