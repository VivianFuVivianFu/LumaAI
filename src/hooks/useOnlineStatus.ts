import { useEffect, useState } from 'react';

/**
 * Custom hook to detect online/offline status
 *
 * Returns true when the browser is online, false when offline.
 * Updates automatically when the connection status changes.
 *
 * @example
 * const isOnline = useOnlineStatus();
 * if (!isOnline) {
 *   return <div>You are offline. Please check your internet connection.</div>;
 * }
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('🔴 Connection lost');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Enhanced hook with additional network information
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      });
    };

    const handleOnline = () => {
      updateStatus();
      console.log('🟢 Connection restored');
    };

    const handleOffline = () => {
      updateStatus();
      console.warn('🔴 Connection lost');
    };

    const handleConnectionChange = () => {
      updateStatus();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API (if supported)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial update
    updateStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return status;
}
