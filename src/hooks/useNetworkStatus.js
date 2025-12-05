import { useState, useEffect } from 'react';
import { runFullSync, needsSync } from '../services/syncService';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to monitor network status and trigger auto-sync
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const { user, firebaseUser } = useAuth();

  useEffect(() => {
    // Handler for when network comes online
    const handleOnline = async () => {
      console.log('🌐 Network connection restored');
      setIsOnline(true);
      
      // Trigger sync if user is authenticated and sync is needed
      if (firebaseUser && user && needsSync()) {
        console.log('🔄 Auto-syncing after reconnection...');
        await triggerSync();
      }
    };

    // Handler for when network goes offline
    const handleOffline = () => {
      console.log('📴 Network connection lost');
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [firebaseUser, user]);

  // Periodic sync check (every 15 minutes)
  useEffect(() => {
    if (!firebaseUser || !user) return;

    const syncInterval = setInterval(async () => {
      if (isOnline && needsSync(15)) {
        console.log('⏰ Periodic sync triggered');
        await triggerSync();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(syncInterval);
  }, [firebaseUser, user, isOnline]);

  // Function to manually trigger sync
  const triggerSync = async () => {
    if (!firebaseUser || !user) {
      console.warn('Cannot sync: user not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    if (!isOnline) {
      console.warn('Cannot sync: offline');
      return { success: false, error: 'No network connection' };
    }

    if (isSyncing) {
      console.warn('Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }

    setIsSyncing(true);
    
    try {
      const result = await runFullSync(firebaseUser.uid, user.id);
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      const errorResult = { success: false, error: error.message };
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    lastSyncResult,
    triggerSync
  };
};

export default useNetworkStatus;

