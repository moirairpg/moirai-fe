import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bold, Italic, Strikethrough, Pencil, Eye } from 'lucide-react';
import { AdventureMessagesPane } from './AdventureMessagesPane';
import { AdventureMessageContextMenu } from './AdventureMessageContextMenu';
import { CommandPicker } from './CommandPicker';
import { useAdventureMessages } from '../hooks/useAdventureMessages';
import { useAdventureWebSocket } from '../hooks/useAdventureWebSocket';
import { useAdventureCommands } from '../hooks/useAdventureCommands';
import { useAuth } from '../../../components/auth/context/AuthContext';
import type { AdventureMessageUpdate } from '../hooks/useAdventureWebSocket';
import type { AdventureMessage } from '../types';
import type { CommandDefinition } from '../commands/types';

type AdventurePageProps = {
  adventureId: string;
};

const saidPrefixRegex = /^(.+?) said[,:]?\s*/;

function stripSaidPrefix(content: string): string {
  return content.replace(saidPrefixRegex, '');
}

function extractSaidName(content: string): string | undefined {
  return content.match(saidPrefixRegex)?.[1];
}

type FormatButton = {
  icon: typeof Bold;
  marker: string;
  titleKey: string;
};

const FORMAT_BUTTONS: FormatButton[] = [
  { icon: Bold, marker: '**', titleKey: 'page.formatting.bold' },
  { icon: Italic, marker: '*', titleKey: 'page.formatting.italic' },
  { icon: Strikethrough, marker: '~~', titleKey: 'page.formatting.strikethrough' },
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  marker: string,
  value: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  let newValue: string;
  let cursorStart: number;
  let cursorEnd: number;

  if (selected) {
    newValue = value.slice(0, start) + marker + selected + marker + value.slice(end);
    cursorStart = start + marker.length;
    cursorEnd = end + marker.length;
  } else {
    newValue = value.slice(0, start) + marker + marker + value.slice(start);
    cursorStart = start + marker.length;
    cursorEnd = cursorStart;
  }

  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.selectionStart = cursorStart;
    textarea.selectionEnd = cursorEnd;
    textarea.focus();
  });
}

type ContextMenuState = {
  x: number;
  y: number;
  messageId: string;
  canEdit: boolean;
  canRetry: boolean;
  canDelete: boolean;
} | null;

export default function AdventurePage({ adventureId }: AdventurePageProps) {
  const { t } = useTranslation('adventure');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [adventureId]);

  useEffect(() => {
    if (!isGenerating) textareaRef.current?.focus();
  }, [isGenerating]);

  useEffect(() => {
    const onFocus = () => { if (!textareaRef.current?.disabled) textareaRef.current?.focus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  useEffect(() => {
    setPickerOpen(input.startsWith('/'));
  }, [input]);

  const {
    messages,
    loadError,
    adventureName,
    narratorName,
    roster,
    permissions,
    appendMessage,
    fetchMore,
    hasMore,
    isFetchingMore,
    removeMessage,
    removeMessagesFromIdInclusive,
    removeMessagesAfterId,
    replaceMessageContent,
  } = useAdventureMessages(adventureId);

  const myMembership = roster.find((m) => m.playerUsername === user?.username);
  const myCharacterName = myMembership?.name;
  const canManage = permissions.some((p) => p.userId === user?.publicId && (p.level === 'OWNER' || p.level === 'WRITE'));

  const reversedMessages = messages.slice().reverse();
  const lastPlayerMessage = reversedMessages.find((m) => m.role === 'user');
  const lastNarratorMessage = reversedMessages.find((m) => m.role === 'narrator');
  const ownsLastPlayerMessage = Boolean(myCharacterName) && lastPlayerMessage?.authorName === myCharacterName;

  const handleUpdate = useCallback((update: AdventureMessageUpdate) => {
    switch (update.change) {
      case 'MESSAGE_REMOVED':
        removeMessage(update.messageId);
        break;

      case 'MESSAGES_REMOVED_FROM':
        removeMessagesFromIdInclusive(update.messageId);
        break;

      case 'MESSAGE_EDITED':
        replaceMessageContent(update.messageId, stripSaidPrefix(update.message.content));
        removeMessagesAfterId(update.messageId);
        break;

      case 'MESSAGE_ADDED': {
        const isUser = update.message.role === 'user';
        const msg: AdventureMessage = {
          id: update.message.id,
          role: isUser ? 'user' : 'narrator',
          content: stripSaidPrefix(update.message.content),
          narratorName: !isUser ? narratorName : undefined,
          authorName: isUser ? extractSaidName(update.message.content) : undefined,
        };

        appendMessage(msg);
        break;
      }

      case 'NARRATION_FAILED':
        break;
    }

    setIsGenerating(update.isNarrationPending);
  }, [
    appendMessage,
    removeMessage,
    removeMessagesFromIdInclusive,
    removeMessagesAfterId,
    replaceMessageContent,
    narratorName,
  ]);

  const {
    sendMessage,
    startAdventure,
    go,
    retry,
    retryFromMessage,
    say,
    editMessage,
    deleteMessage,
  } = useAdventureWebSocket(adventureId, handleUpdate);

  const { handleInput } = useAdventureCommands(
    adventureId,
    messages,
    { startAdventure, go, retry, say },
  );

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    setInput('');
    setPickerOpen(false);

    const handled = handleInput(trimmed, appendMessage, setIsGenerating);

    if (handled) return;

    setIsGenerating(true);
    sendMessage(trimmed);
  }, [input, isGenerating, sendMessage, handleInput, appendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormat = (marker: string) => {
    if (!textareaRef.current) return;
    applyFormat(textareaRef.current, marker, input, setInput);
  };

  const handleCommandSelect = (cmd: CommandDefinition) => {
    setInput(`/${cmd.name}${cmd.args.length > 0 ? ' ' : ''}`);
    setPickerOpen(false);
    textareaRef.current?.focus();
  };

  const handleContextMenu = (e: React.MouseEvent, message: AdventureMessage) => {
    e.preventDefault();

    if (canManage) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: message.id,
        canEdit: true,
        canRetry: message.role === 'narrator',
        canDelete: true,
      });

      return;
    }

    if (!ownsLastPlayerMessage) {
      return;
    }

    const isOwnLatestMessage = message.id === lastPlayerMessage?.id;
    const isLatestNarration = message.id === lastNarratorMessage?.id;

    if (!isOwnLatestMessage && !isLatestNarration) {
      return;
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: message.id,
      canEdit: isOwnLatestMessage,
      canRetry: true,
      canDelete: false,
    });
  };

  const handleContextAction = (action: 'edit' | 'retry' | 'delete', messageId: string) => {
    if (action === 'edit') {
      setEditingMessageId(messageId);
      return;
    }

    if (action === 'delete') {
      deleteMessage(messageId);
      return;
    }

    if (canManage) {
      retryFromMessage(messageId);
      return;
    }

    retry();
  };

  const handleEditConfirm = (messageId: string, newContent: string) => {
    setEditingMessageId(null);
    editMessage(messageId, newContent);
  };

  if (loadError) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-foreground">{t('page.noAccess.title')}</p>
          <p className="text-sm text-muted-foreground">{t('page.noAccess.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate font-semibold text-foreground">
            {adventureName ?? t('page.loading')}
          </span>
          <span className="flex-shrink-0 text-muted-foreground">/</span>
          <span className="flex-shrink-0 text-muted-foreground">{t('page.playing')}</span>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => navigate(`/adventure/${adventureId}/edit`)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('card.actions.edit', { ns: 'collection' })}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/adventure/${adventureId}/view`)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            {t('card.actions.view', { ns: 'collection' })}
          </button>
        )}
      </div>

      <AdventureMessagesPane
        adventureId={adventureId}
        messages={messages}
        currentCharacterName={myCharacterName}
        isGenerating={isGenerating}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onFetchMore={fetchMore}
        editingMessageId={editingMessageId}
        onContextMenu={handleContextMenu}
        onEditConfirm={handleEditConfirm}
        onEditCancel={() => setEditingMessageId(null)}
      />

      {contextMenu &&
        createPortal(
          <AdventureMessageContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            canEdit={contextMenu.canEdit}
            canRetry={contextMenu.canRetry}
            canDelete={contextMenu.canDelete}
            onAction={(action) => handleContextAction(action, contextMenu.messageId)}
            onDismiss={() => setContextMenu(null)}
          />,
          document.body,
        )}

      {myMembership && (
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-1 mb-1.5">
          {FORMAT_BUTTONS.map(({ icon: Icon, marker, titleKey }) => (
            <button
              key={marker}
              type="button"
              title={t(titleKey)}
              onMouseDown={(e) => { e.preventDefault(); handleFormat(marker); }}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {pickerOpen && (
          <CommandPicker
            input={input}
            onSelect={handleCommandSelect}
            onDismiss={() => setPickerOpen(false)}
          />
        )}

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            style={{ minHeight: '2.25rem', maxHeight: '8rem', overflowY: 'auto' }}
            placeholder={t('page.inputPlaceholder')}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {t('page.send')}
          </button>
        </form>
      </div>
      )}
    </div>
  );
}
