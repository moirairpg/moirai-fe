import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '../../../contexts/WebSocketContext';

type MessageSummary = {
  id: string;
  role: string;
  content: string;
  status: string;
  authorId: string | null;
  authorCharacterName: string | null;
  creationDate: string;
};

export type AdventureMessageUpdate =
  | { change: 'MESSAGE_ADDED'; messageId: string; message: MessageSummary; isNarrationPending: boolean }
  | { change: 'MESSAGE_EDITED'; messageId: string; message: MessageSummary; isNarrationPending: boolean }
  | { change: 'MESSAGE_REMOVED'; messageId: string; message: null; isNarrationPending: boolean }
  | { change: 'MESSAGES_REMOVED_FROM'; messageId: string; message: null; isNarrationPending: boolean }
  | { change: 'MESSAGES_REMOVED_AFTER'; messageId: string; message: null; isNarrationPending: boolean }
  | { change: 'NARRATION_FAILED'; messageId: null; message: null; isNarrationPending: false };

type UseAdventureWebSocketResult = {
  sendMessage: (content: string) => void;
  startAdventure: () => void;
  go: () => void;
  retry: () => void;
  retryFromMessage: (messageId: string) => void;
  say: (content: string) => void;
  editMessage: (messageId: string, content: string) => void;
  editMessageAndGenerateOutput: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
};

export function useAdventureWebSocket(
  adventureId: string,
  onUpdate: (update: AdventureMessageUpdate) => void,
): UseAdventureWebSocketResult {
  const { subscribe, publish, isConnected } = useWebSocket();
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe(`/topic/adventures/${adventureId}`, (data: unknown) => {
      onUpdateRef.current(data as AdventureMessageUpdate);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [adventureId, isConnected, subscribe]);

  const send = useCallback(
    (path: string, body: object = {}) =>
      publish(`/app/adventures/${adventureId}${path}`, JSON.stringify(body)),
    [adventureId, publish],
  );

  return {
    sendMessage: (content) => send('/messages', { content }),
    startAdventure: () => send('/start'),
    go: () => send('/go'),
    retry: () => send('/retry'),
    retryFromMessage: (messageId) => send(`/messages/${messageId}/retry`),
    say: (content) => send('/say', { content }),
    editMessage: (messageId, content) => send(`/messages/${messageId}/edit`, { content }),
    editMessageAndGenerateOutput: (messageId, content) =>
      send(`/messages/${messageId}/edit-and-generate`, { content }),
    deleteMessage: (messageId) => send(`/messages/${messageId}/delete`),
  };
}
