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

export type DiceRollSummary = {
  characterName: string;
  attribute: string | null;
  attributeLevel: number;
  skill: string | null;
  skillLevel: number;
  difficulty: string;
  dc: number;
  naturalRoll: number;
  modifier: number;
  total: number;
  outcome: string;
};

export type ImpossibleActionSummary = {
  characterName: string;
  attribute: string | null;
  skill: string | null;
};

export type XpGainSummary = {
  amount: number;
  total: number;
  levelUpTarget: number;
};

export type LevelUpSummary = {
  characterName: string;
  newLevel: number;
  attributePoints: number;
  skillPoints: number;
};

export type AdventureMessageUpdate =
  | { change: 'MESSAGE_ADDED'; messageId: string; message: MessageSummary; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'MESSAGE_EDITED'; messageId: string; message: MessageSummary; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'MESSAGE_REMOVED'; messageId: string; message: null; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'MESSAGES_REMOVED_FROM'; messageId: string; message: null; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'MESSAGES_REMOVED_AFTER'; messageId: string; message: null; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'NARRATION_FAILED'; messageId: null; message: null; roll: null; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: false }
  | { change: 'DICE_ROLLED'; messageId: string; message: null; roll: DiceRollSummary; impossibleAction: null; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'IMPOSSIBLE_ACTION_ATTEMPTED'; messageId: string; message: null; roll: null; impossibleAction: ImpossibleActionSummary; xpGain: null; levelUp: null; isNarrationPending: boolean }
  | { change: 'XP_GAINED'; messageId: string; message: null; roll: null; impossibleAction: null; xpGain: XpGainSummary; levelUp: null; isNarrationPending: boolean }
  | { change: 'LEVEL_UP'; messageId: string; message: null; roll: null; impossibleAction: null; xpGain: null; levelUp: LevelUpSummary; isNarrationPending: boolean };

type UseAdventureWebSocketResult = {
  sendMessage: (content: string, isNarrationRequested: boolean) => void;
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

    const playerSubscription = subscribe(`/user/queue/adventures/${adventureId}/events`, (data: unknown) => {
      onUpdateRef.current(data as AdventureMessageUpdate);
    });

    return () => {
      subscription?.unsubscribe();
      playerSubscription?.unsubscribe();
    };
  }, [adventureId, isConnected, subscribe]);

  const send = useCallback(
    (path: string, body: object = {}) =>
      publish(`/app/adventures/${adventureId}${path}`, JSON.stringify(body)),
    [adventureId, publish],
  );

  return {
    sendMessage: (content, isNarrationRequested) =>
      send('/messages', { content, generateNarration: isNarrationRequested }),
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
