import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const CONFIRM_CLASS = {
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

type ConfirmDialogProps = {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dismissLabel?: string;
  confirmVariant?: keyof typeof CONFIRM_CLASS;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  dismissLabel,
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full ${dismissLabel ? 'max-w-lg' : 'max-w-sm'} rounded-lg border border-border bg-background p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-foreground">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          {dismissLabel && (
            <button
              type="button"
              onClick={onClose}
              className="mr-auto whitespace-nowrap rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              {dismissLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel ?? onClose}
            className="whitespace-nowrap rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {cancelLabel ?? t('confirm.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ${CONFIRM_CLASS[confirmVariant]}`}
          >
            {confirmLabel ?? t('confirm.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
