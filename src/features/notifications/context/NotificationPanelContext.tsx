import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSystemNotificationsWebSocket } from '../hooks/useSystemNotificationsWebSocket';
import { NOTIFICATION_KIND } from '../constants';

type NotificationPanelContextValue = {
  isPanelOpen: boolean;
  togglePanel: () => void;
};

const NotificationPanelContext = createContext<NotificationPanelContextValue | null>(null);

export function useNotificationPanel(): NotificationPanelContextValue {
  const ctx = useContext(NotificationPanelContext);
  if (!ctx) throw new Error('useNotificationPanel must be used within NotificationPanelProvider');
  return ctx;
}

type NotificationPanelProviderProps = {
  children: ReactNode;
};

export function NotificationPanelProvider({ children }: NotificationPanelProviderProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { systemNotifications } = useSystemNotificationsWebSocket();
  const handledRemovalsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const removals = systemNotifications.filter(
      (n) => n.metadata?.kind === NOTIFICATION_KIND.ADVENTURE_MEMBER_REMOVED
        && !handledRemovalsRef.current.has(n.publicId),
    );

    if (removals.length > 0) {
      removals.forEach((n) => handledRemovalsRef.current.add(n.publicId));
      window.dispatchEvent(new Event('adventure-list-changed'));
    }
  }, [systemNotifications]);

  const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

  const value = useMemo<NotificationPanelContextValue>(
    () => ({ isPanelOpen, togglePanel }),
    [isPanelOpen, togglePanel],
  );

  return <NotificationPanelContext.Provider value={value}>{children}</NotificationPanelContext.Provider>;
}
