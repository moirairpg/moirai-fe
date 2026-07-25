import { useState } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useSystemNotificationsWebSocket } from '../hooks/useSystemNotificationsWebSocket';
import { useReadNotification } from '../hooks/useReadNotification';
import { useNotificationPanel } from '../context/NotificationPanelContext';
import { api } from '../../../utils/api';
import { InvitationNotification } from './InvitationNotification';
import { JoinAdventureModal } from './JoinAdventureModal';

type ActiveInvite = { invitationId: string; adventureName: string };

export function NotificationPanel() {
  const { t } = useTranslation('notifications');
  const { systemNotifications } = useSystemNotificationsWebSocket();
  const { isPanelOpen, togglePanel } = useNotificationPanel();
  const { mutate: markRead } = useReadNotification();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeInvite, setActiveInvite] = useState<ActiveInvite | null>(null);
  const [declineErrors, setDeclineErrors] = useState<Record<string, string>>({});

  const unreadCount = systemNotifications.filter((n) => !readIds.has(n.publicId)).length;

  const handleRead = (publicId: string) => {
    void markRead(publicId);
    setReadIds((prev) => new Set(prev).add(publicId));
  };

  const handleDecline = async (publicId: string) => {
    const res = await api.adventureInvitations.decline(publicId);
    if (!res.ok) {
      setDeclineErrors((prev) => ({ ...prev, [publicId]: t('invite.errors.declineFailed') }));
      return;
    }
    handleRead(publicId);
  };

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className="relative flex items-center justify-center rounded-lg p-2 text-foreground transition-colors hover:bg-accent/50"
        type="button"
        aria-label={t('panel.toggleAriaLabel')}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isPanelOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 max-h-80 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          {systemNotifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t('panel.empty')}</p>
          ) : (
            systemNotifications.map((n) => {
              const isRead = readIds.has(n.publicId);

              if (n.isInteractable && n.metadata?.kind === 'ADVENTURE_INVITE') {
                return (
                  <InvitationNotification
                    key={n.publicId}
                    message={n.message}
                    creationDate={n.creationDate}
                    isRead={isRead}
                    error={declineErrors[n.publicId]}
                    onAccept={() =>
                      setActiveInvite({ invitationId: n.publicId, adventureName: String(n.metadata?.adventureName ?? '') })
                    }
                    onDecline={() => handleDecline(n.publicId)}
                  />
                );
              }

              return (
                <button
                  key={n.publicId}
                  type="button"
                  onClick={() => !isRead && handleRead(n.publicId)}
                  disabled={isRead}
                  className={`flex w-full flex-col items-start gap-1 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 ${
                    isRead
                      ? 'cursor-default opacity-60'
                      : 'cursor-pointer font-medium hover:bg-accent/50'
                  }`}
                >
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.creationDate), { addSuffix: true })}
                  </p>
                </button>
              );
            })
          )}
        </div>
      )}

      {activeInvite && (
        <JoinAdventureModal
          invitationId={activeInvite.invitationId}
          adventureName={activeInvite.adventureName}
          onJoined={() => {
            handleRead(activeInvite.invitationId);
            setActiveInvite(null);
          }}
          onClose={() => setActiveInvite(null)}
        />
      )}
    </div>
  );
}
