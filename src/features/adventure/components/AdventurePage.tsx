import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bold, Italic, Strikethrough, Pencil, Eye } from 'lucide-react';
import { AdventureMessagesPane } from './AdventureMessagesPane';
import { AdventureMessageContextMenu } from './AdventureMessageContextMenu';
import { CommandPicker } from './CommandPicker';
import { CommandArgumentForm } from './CommandArgumentForm';
import { useAdventureMessages } from '../hooks/useAdventureMessages';
import { useAdventureWebSocket } from '../hooks/useAdventureWebSocket';
import { useAdventureCommands } from '../hooks/useAdventureCommands';
import { speakerKey, useSpeakerColors } from '../hooks/useSpeakerColors';
import { useAuth } from '../../../components/auth/context/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import type { AdventureMessageUpdate } from '../hooks/useAdventureWebSocket';
import type { AdventureMessage } from '../types';
import type { CommandDefinition, ParsedCommand } from '../commands/types';

type AdventurePageProps = {
  adventureId: string;
};

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
  canEditAndGenerate: boolean;
  canRetry: boolean;
  canDelete: boolean;
} | null;

type EditingState = { messageId: string; mode: 'edit' | 'edit-and-generate' } | null;

export default function AdventurePage({ adventureId }: AdventurePageProps) {
  const { t } = useTranslation('adventure');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editing, setEditing] = useState<EditingState>(null);
  const [activeCommand, setActiveCommand] = useState<CommandDefinition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCommandFormOpen = activeCommand !== null;

  useEffect(() => {
    if (isCommandFormOpen) return;

    textareaRef.current?.focus();
  }, [adventureId, isCommandFormOpen]);

  useEffect(() => {
    if (isGenerating || isCommandFormOpen) return;

    textareaRef.current?.focus();
  }, [isGenerating, isCommandFormOpen]);

  useEffect(() => {
    if (isCommandFormOpen) return;

    const onFocus = () => { if (!textareaRef.current?.disabled) textareaRef.current?.focus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [isCommandFormOpen]);

  useEffect(() => {
    setPickerOpen(input.startsWith('/'));
  }, [input]);

  const {
    messages,
    loadError,
    adventureName,
    roster,
    canManage,
    contextAttributes,
    updateContextAttributes,
    appendMessage,
    fetchMore,
    hasMore,
    isFetchingMore,
    removeMessage,
    removeMessagesFromIdInclusive,
    removeMessagesAfterId,
    replaceMessageContent,
  } = useAdventureMessages(adventureId);

  const speakerKeys = useMemo(
    () => Array.from(new Set(messages.filter((m) => m.role !== 'system').map(speakerKey))),
    [messages],
  );

  const speakerColors = useSpeakerColors(adventureId, speakerKeys, isDarkMode);

  const getSpeakerColor = (message: AdventureMessage) => speakerColors[speakerKey(message)];

  const myMembership = roster.find((m) => m.playerUsername === user?.username);

  const reversedMessages = messages.slice().reverse();
  const lastPlayerMessage = reversedMessages.find((m) => m.role === 'user');
  const lastNarratorMessage = reversedMessages.find((m) => m.role === 'narrator');
  const ownsLastPlayerMessage = Boolean(user?.publicId) && lastPlayerMessage?.authorId === user?.publicId;

  const handleUpdate = useCallback((update: AdventureMessageUpdate) => {
    switch (update.change) {
      case 'MESSAGE_REMOVED':
        removeMessage(update.messageId);
        break;

      case 'MESSAGES_REMOVED_FROM':
        removeMessagesFromIdInclusive(update.messageId);
        break;

      case 'MESSAGE_EDITED':
        replaceMessageContent(update.messageId, update.message.content);
        break;

      case 'MESSAGES_REMOVED_AFTER':
        removeMessagesAfterId(update.messageId);
        break;

      case 'MESSAGE_ADDED': {
        const isUser = update.message.role === 'user';
        const msg: AdventureMessage = {
          id: update.message.id,
          role: isUser ? 'user' : 'narrator',
          content: update.message.content,
          authorName: update.message.authorCharacterName ?? undefined,
          authorId: update.message.authorId ?? undefined,
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
  ]);

  const {
    sendMessage,
    startAdventure,
    go,
    retry,
    retryFromMessage,
    say,
    editMessage,
    editMessageAndGenerateOutput,
    deleteMessage,
  } = useAdventureWebSocket(adventureId, handleUpdate);

  const { handleInput, handleParsedCommand } = useAdventureCommands(
    adventureId,
    messages,
    { startAdventure, go, retry, say },
    updateContextAttributes,
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
    if (cmd.args.length > 0) {
      setInput('');
      setPickerOpen(false);
      setActiveCommand(cmd);
      return;
    }

    setInput(`/${cmd.name}`);
    setPickerOpen(false);
    textareaRef.current?.focus();
  };

  const handleCommandFormSubmit = (command: ParsedCommand) => {
    setActiveCommand(null);
    handleParsedCommand(command, appendMessage, setIsGenerating);
  };

  const handleCommandFormCancel = () => {
    setActiveCommand(null);
  };

  const handleContextMenu = (e: React.MouseEvent, message: AdventureMessage) => {
    e.preventDefault();

    if (isGenerating) return;

    const isOwnMessage = Boolean(user?.publicId) && message.authorId === user?.publicId;

    if (canManage) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: message.id,
        canEdit: true,
        canEditAndGenerate: message.role === 'user',
        canRetry: message.role === 'narrator',
        canDelete: true,
      });

      return;
    }

    const isOwnLatestMessage = message.id === lastPlayerMessage?.id && ownsLastPlayerMessage;
    const isLatestNarration = message.id === lastNarratorMessage?.id;

    if (!isOwnMessage && !isLatestNarration) {
      return;
    }

    if (isLatestNarration && !ownsLastPlayerMessage) {
      return;
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: message.id,
      canEdit: isOwnMessage,
      canEditAndGenerate: isOwnLatestMessage,
      canRetry: isLatestNarration || isOwnLatestMessage,
      canDelete: false,
    });
  };

  const handleContextAction = (
    action: 'edit' | 'edit-and-generate' | 'retry' | 'delete',
    messageId: string,
  ) => {
    if (action === 'edit' || action === 'edit-and-generate') {
      setEditing({ messageId, mode: action });
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
    const mode = editing?.mode;

    setEditing(null);

    if (mode === 'edit-and-generate') {
      editMessageAndGenerateOutput(messageId, newContent);
      return;
    }

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
        currentUserId={user?.publicId}
        getSpeakerColor={getSpeakerColor}
        isGenerating={isGenerating}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onFetchMore={fetchMore}
        editingMessageId={editing?.messageId ?? null}
        onContextMenu={handleContextMenu}
        onEditConfirm={handleEditConfirm}
        onEditCancel={() => setEditing(null)}
      />

      {contextMenu && !isGenerating &&
        createPortal(
          <AdventureMessageContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            canEdit={contextMenu.canEdit}
            canEditAndGenerate={contextMenu.canEditAndGenerate}
            canRetry={contextMenu.canRetry}
            canDelete={contextMenu.canDelete}
            onAction={(action) => handleContextAction(action, contextMenu.messageId)}
            onDismiss={() => setContextMenu(null)}
          />,
          document.body,
        )}

      {myMembership && (
      <div className="border-t border-border/50 p-4">
        {activeCommand ? (
          <CommandArgumentForm
            command={activeCommand}
            contextAttributes={contextAttributes}
            isGenerating={isGenerating}
            onSubmit={handleCommandFormSubmit}
            onCancel={handleCommandFormCancel}
          />
        ) : (
          <>
            <div className="flex gap-1 mb-1.5">
              {FORMAT_BUTTONS.map(({ icon: Icon, marker, titleKey }) => (
                <button
                  key={marker}
                  type="button"
                  title={t(titleKey)}
                  disabled={isGenerating}
                  onMouseDown={(e) => { e.preventDefault(); handleFormat(marker); }}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {pickerOpen && !isGenerating && (
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
          </>
        )}
      </div>
      )}
    </div>
  );
}
