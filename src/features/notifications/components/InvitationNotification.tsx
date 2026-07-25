import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

type InvitationNotificationProps = {
  message: string;
  creationDate: string;
  isRead: boolean;
  error?: string;
  onAccept: () => void;
  onDecline: () => void;
};

export function InvitationNotification({
  message,
  creationDate,
  isRead,
  error,
  onAccept,
  onDecline,
}: InvitationNotificationProps) {
  const { t } = useTranslation('notifications');

  return (
    <div className={`flex flex-col gap-2 border-b border-border/50 px-4 py-3 last:border-b-0 ${isRead ? 'opacity-60' : ''}`}>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(creationDate), { addSuffix: true })}
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!isRead && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('invite.accept')}
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            {t('invite.decline')}
          </button>
        </div>
      )}
    </div>
  );
}
