// hooks/useRealtimeRole.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

// Custom event for role changes (for components to listen to)
export const ROLE_CHANGED_EVENT = 'user-role-changed';

interface UseRealtimeRoleOptions {
  onRoleChange?: (oldRole: string, newRole: string) => void;
  enableLogging?: boolean;
}

export function useRealtimeRole(options: UseRealtimeRoleOptions = {}) {
  const { user, refetchUser } = useAuth();
  const [isRoleChanging, setIsRoleChanging] = useState(false);
  const [lastRoleUpdate, setLastRoleUpdate] = useState<Date | null>(null);

  // Listen for role changes
  useEffect(() => {
    const handleRoleChange = async (event: Event) => {
      const customEvent = event as CustomEvent<{ oldRole: string; newRole: string; userId: string }>;
      const { oldRole, newRole, userId } = customEvent.detail;
      
      if (options.enableLogging) {
        console.log(`🔄 Role changed from ${oldRole} to ${newRole}`, { userId });
      }

      setIsRoleChanging(true);
      setLastRoleUpdate(new Date());

      // Call the callback if provided
      if (options.onRoleChange) {
        options.onRoleChange(oldRole, newRole);
      }
      
      setTimeout(() => setIsRoleChanging(false), 1000);
    };

    window.addEventListener(ROLE_CHANGED_EVENT, handleRoleChange as EventListener);

    return () => {
      window.removeEventListener(ROLE_CHANGED_EVENT, handleRoleChange as EventListener);
    };
  }, [options]);

  // Manual function to check role
  const checkRole = useCallback(async () => {
    await refetchUser();
  }, [refetchUser]);

  return {
    currentRole: user?.role,
    isRoleChanging,
    lastRoleUpdate,
    checkRole,
    userId: user?.id
  };
}