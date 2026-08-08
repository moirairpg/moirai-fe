import { useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import { parseCommand } from '../commands/parser';
import type { AdventureMessage } from '../types';
import type { ParsedCommand } from '../commands/types';
import type { ContextAttributes } from '../../sidebar/types';

export type AdventureActions = {
  startAdventure: () => void;
  go: () => void;
  retry: () => void;
  say: (content: string) => void;
};

type UseAdventureCommandsResult = {
  handleInput: (
    input: string,
    appendMessage: (msg: AdventureMessage) => void,
    setIsGenerating: (v: boolean) => void,
  ) => boolean;
  handleParsedCommand: (
    command: ParsedCommand,
    appendMessage: (msg: AdventureMessage) => void,
    setIsGenerating: (v: boolean) => void,
  ) => void;
};

export function useAdventureCommands(
  adventureId: string,
  messages: AdventureMessage[],
  actions: AdventureActions,
  onContextUpdated: (patch: Partial<ContextAttributes>) => void,
): UseAdventureCommandsResult {
  const handleInput = useCallback(
    (
      input: string,
      appendMessage: (msg: AdventureMessage) => void,
      setIsGenerating: (v: boolean) => void,
    ): boolean => {
      if (!input.startsWith('/')) return false;

      const parsed = parseCommand(input);

      if (!parsed) {
        appendMessage(systemMessage('Missing required argument.'));
        return true;
      }

      if (parsed.name === 'unknown') {
        appendMessage(systemMessage(`Unknown command: /${parsed.raw}`));
        return true;
      }

      if (parsed.name === 'missing-arg') {
        appendMessage(systemMessage(`/${parsed.commandName} requires <${parsed.argName}> — ${parsed.argDescription}`));
        return true;
      }

      if (parsed.name === 'invalid-arg') {
        appendMessage(systemMessage(`/${parsed.commandName}: <${parsed.argName}> ${parsed.message}`));
        return true;
      }

      dispatchCommand(parsed, adventureId, messages, actions, appendMessage, setIsGenerating, onContextUpdated);
      return true;
    },
    [adventureId, messages, actions, onContextUpdated],
  );

  const handleParsedCommand = useCallback(
    (
      command: ParsedCommand,
      appendMessage: (msg: AdventureMessage) => void,
      setIsGenerating: (v: boolean) => void,
    ) => {
      dispatchCommand(command, adventureId, messages, actions, appendMessage, setIsGenerating, onContextUpdated);
    },
    [adventureId, messages, actions, onContextUpdated],
  );

  return { handleInput, handleParsedCommand };
}

function systemMessage(content: string): AdventureMessage {
  return { id: crypto.randomUUID(), role: 'system', content };
}

function dispatchCommand(
  command: ParsedCommand,
  adventureId: string,
  messages: AdventureMessage[],
  actions: AdventureActions,
  appendMessage: (msg: AdventureMessage) => void,
  setIsGenerating: (v: boolean) => void,
  onContextUpdated: (patch: Partial<ContextAttributes>) => void,
) {
  switch (command.name) {
    case 'start':
      setIsGenerating(true);
      actions.startAdventure();
      break;

    case 'go':
      setIsGenerating(true);
      actions.go();
      break;

    case 'retry': {
      const lastMessage = messages[messages.length - 1];

      if (!lastMessage || lastMessage.role !== 'narrator') {
        appendMessage(systemMessage('/retry can only be used after an AI response.'));
        break;
      }

      setIsGenerating(true);
      actions.retry();
      break;
    }

    case 'say':
      actions.say(command.text);
      break;

    case 'nudge':
      apiFetch(`/api/adventures/${adventureId}/nudge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudge: command.text }),
      })
        .then(() => {
          onContextUpdated({ nudge: command.text });
          appendMessage(systemMessage('Nudge updated.'));
        })
        .catch(() => appendMessage(systemMessage('Failed to update nudge.')));
      break;

    case 'authors-note':
      apiFetch(`/api/adventures/${adventureId}/authors-note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorsNote: command.text }),
      })
        .then(() => {
          onContextUpdated({ authorsNote: command.text });
          appendMessage(systemMessage("Author's note updated."));
        })
        .catch(() => appendMessage(systemMessage("Failed to update author's note.")));
      break;

    case 'scene':
      apiFetch(`/api/adventures/${adventureId}/scene`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: command.text }),
      })
        .then(() => {
          onContextUpdated({ scene: command.text });
          appendMessage(systemMessage('Scene updated.'));
        })
        .catch(() => appendMessage(systemMessage('Failed to update scene.')));
      break;

    case 'bump':
      apiFetch(`/api/adventures/${adventureId}/bump`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bump: command.text, bumpFrequency: command.frequency }),
      })
        .then(() => {
          onContextUpdated({ bump: command.text, bumpFrequency: command.frequency });
          appendMessage(systemMessage(`Bump updated (every ${command.frequency} messages).`));
        })
        .catch(() => appendMessage(systemMessage('Failed to update bump.')));
      break;
  }
}
