import { useEffect, useRef } from 'react';

type ContextMenuAction = 'edit' | 'edit-and-generate' | 'retry' | 'delete';

type AdventureMessageContextMenuProps = {
  x: number;
  y: number;
  canEdit: boolean;
  canEditAndGenerate: boolean;
  canRetry: boolean;
  canDelete: boolean;
  onAction: (action: ContextMenuAction) => void;
  onDismiss: () => void;
};

export function AdventureMessageContextMenu({
  x,
  y,
  canEdit,
  canEditAndGenerate,
  canRetry,
  canDelete,
  onAction,
  onDismiss,
}: AdventureMessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: y, left: x, zIndex: 50 }}
      className="min-w-[140px] rounded-md border border-border bg-popover shadow-md py-1"
    >
      {canEdit && (
        <button
          type="button"
          onClick={() => { onAction('edit'); onDismiss(); }}
          className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
        >
          Edit
        </button>
      )}
      {canEditAndGenerate && (
        <button
          type="button"
          onClick={() => { onAction('edit-and-generate'); onDismiss(); }}
          className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
        >
          Edit and generate
        </button>
      )}
      {canRetry && (
        <button
          type="button"
          onClick={() => { onAction('retry'); onDismiss(); }}
          className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
        >
          Retry
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => { onAction('delete'); onDismiss(); }}
          className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
        >
          Delete
        </button>
      )}
    </div>
  );
}
