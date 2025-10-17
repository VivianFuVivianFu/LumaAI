import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * OfflineIndicator Component
 *
 * Displays a banner at the top of the screen when the user is offline.
 * Shows a brief confirmation message when connection is restored.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }

    if (isOnline && wasOffline) {
      // Show "back online" message briefly
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <WifiOff className="w-5 h-5 animate-pulse" />
          <span className="font-medium">
            You are offline. Please check your internet connection.
          </span>
        </div>
      </div>
    );
  }

  // "Back online" confirmation message
  if (showOnlineMessage) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-600 text-white py-3 px-6 rounded-xl shadow-lg animate-slide-in-right">
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Back online!</span>
        </div>
      </div>
    );
  }

  return null;
}
