'use client';

import * as React from 'react';
import { enableFirebaseNetwork, disableFirebaseNetwork } from '@/lib/firebase-config';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      console.log('Network came back online');
      setIsOnline(true);
      try {
        await enableFirebaseNetwork();
      } catch (error) {
        console.error('Failed to re-enable Firebase network:', error);
      }
    };

    const handleOffline = async () => {
      console.log('Network went offline');
      setIsOnline(false);
      try {
        await disableFirebaseNetwork();
      } catch (error) {
        console.error('Failed to disable Firebase network:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}