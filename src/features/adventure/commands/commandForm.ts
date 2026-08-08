import type { ContextAttributes } from '../../sidebar/types';
import type { CommandArgDefinition, CommandDefinition, ParsedCommand } from './types';

export type CommandFormValues = Record<string, string>;

export function initialCommandFormValues(
  command: CommandDefinition,
  attributes: ContextAttributes,
): CommandFormValues {
  switch (command.name) {
    case 'say':
      return { text: '' };
    case 'nudge':
      return { text: attributes.nudge };
    case 'authors-note':
      return { text: attributes.authorsNote };
    case 'scene':
      return { text: attributes.scene };
    case 'bump':
      return {
        text: attributes.bump,
        frequency: attributes.bumpFrequency > 0 ? String(attributes.bumpFrequency) : '',
      };
    default:
      return {};
  }
}

export function isCommandFieldValid(arg: CommandArgDefinition, value: string): boolean {
  if (!arg.required && value.trim().length === 0) return true;

  if (arg.type === 'integer') {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
  }

  return value.trim().length > 0;
}

export function toCommand(
  command: CommandDefinition,
  values: CommandFormValues,
): ParsedCommand | null {
  switch (command.name) {
    case 'say':
      return { name: 'say', text: values.text.trim() };
    case 'nudge':
      return { name: 'nudge', text: values.text.trim() };
    case 'authors-note':
      return { name: 'authors-note', text: values.text.trim() };
    case 'scene':
      return { name: 'scene', text: values.text.trim() };
    case 'bump':
      return { name: 'bump', text: values.text.trim(), frequency: Number(values.frequency) };
    default:
      return null;
  }
}
